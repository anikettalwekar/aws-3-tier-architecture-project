pipeline {
  agent any

  environment {
    AWS_REGION = "ap-south-1"
    AWS_ACCOUNT_ID = "290690313212"
    FRONTEND_REPO = "frontend-ecr"
    BACKEND_REPO  = "backend-ecr"
    FRONTEND_IMAGE = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${FRONTEND_REPO}"
    BACKEND_IMAGE  = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_REPO}"
    K8S_NAMESPACE = "cricket"
    // commit-based tag for immutability
    IMAGE_TAG = "${env.GIT_COMMIT ?: 'latest'}"
  }

  options {
    // keep some build logs/artifacts
    timestamps()
    ansiColor('xterm')
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        script {
          if (!env.GIT_COMMIT) {
            env.GIT_COMMIT = sh(returnStdout: true, script: "git rev-parse --short HEAD || echo latest").trim()
            env.IMAGE_TAG = env.GIT_COMMIT
          }
        }
      }
    }

    stage('Ensure ECR repos exist') {
      steps {
        sh label: 'Create ECR repos if missing', script: """
          set -e
          aws --region ${AWS_REGION} ecr describe-repositories --repository-names ${BACKEND_REPO} >/dev/null 2>&1 || \
            aws --region ${AWS_REGION} ecr create-repository --repository-name ${BACKEND_REPO} >/dev/null
          aws --region ${AWS_REGION} ecr describe-repositories --repository-names ${FRONTEND_REPO} >/dev/null 2>&1 || \
            aws --region ${AWS_REGION} ecr create-repository --repository-name ${FRONTEND_REPO} >/dev/null
          echo "ECR repos exist (or were created)."
        """
      }
    }

    stage('Build & Push Backend Image') {
      steps {
        dir('backend') {
          sh label: 'Build backend image', script: """
            set -e
            docker build -t ${BACKEND_REPO}:${IMAGE_TAG} .
            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
            docker tag ${BACKEND_REPO}:${IMAGE_TAG} ${BACKEND_IMAGE}:${IMAGE_TAG}
            docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
            docker tag ${BACKEND_REPO}:${IMAGE_TAG} ${BACKEND_IMAGE}:latest
            docker push ${BACKEND_IMAGE}:latest || true
          """
        }
      }
    }

    stage('Deploy Backend to EKS') {
      steps {
        withCredentials([file(credentialsId: 'eks-kubeconfig', variable: 'KUBECONFIG_FILE')]) {
          sh label: 'Apply backend k8s manifests', script: """
            set -e
            export KUBECONFIG=\$KUBECONFIG_FILE

            # create namespace if not exists
            kubectl get ns ${K8S_NAMESPACE} >/dev/null 2>&1 || kubectl create ns ${K8S_NAMESPACE}

            # backend Deployment
            cat <<EOF | kubectl apply -n ${K8S_NAMESPACE} -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: ${BACKEND_IMAGE}:${IMAGE_TAG}
        imagePullPolicy: Always
        env:
        - name: DB_HOST
          value: "${env.DB_HOST ?: ''}"
        - name: DB_USER
          value: "${env.DB_USER ?: ''}"
        - name: DB_PASS
          value: "${env.DB_PASS ?: ''}"
        - name: DB_NAME
          value: "${env.DB_NAME ?: 'projectdb'}"
        ports:
        - containerPort: 3000
EOF

            # backend Service (LoadBalancer)
            cat <<EOF | kubectl apply -n ${K8S_NAMESPACE} -f -
apiVersion: v1
kind: Service
metadata:
  name: backend-svc
spec:
  type: LoadBalancer
  selector:
    app: backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
EOF

            # wait for deployment rollout
            kubectl rollout status deploy/backend-deployment -n ${K8S_NAMESPACE} --timeout=180s || true
          """
        }
      }
    }

    stage('Wait for Backend LoadBalancer') {
      steps {
        withCredentials([file(credentialsId: 'eks-kubeconfig', variable: 'KUBECONFIG_FILE')]) {
          script {
            env.BE_HOST = ""
            sh label: 'Wait for LB hostname', script: """
              set -e
              export KUBECONFIG=\$KUBECONFIG_FILE
              echo "Waiting for backend LB..."
              for i in \$(seq 1 60); do
                HOST=\$(kubectl get svc backend-svc -n ${K8S_NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true)
                IP=\$(kubectl get svc backend-svc -n ${K8S_NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
                if [ -n "\$HOST" ]; then
                  echo "Found hostname: \$HOST"
                  echo \$HOST > /tmp/backend_host
                  exit 0
                elif [ -n "\$IP" ]; then
                  echo "Found IP: \$IP"
                  echo \$IP > /tmp/backend_host
                  exit 0
                else
                  echo "Attempt \$i: LB not ready yet. Sleeping 10s..."
                  sleep 10
                fi
              done
              echo "Timed out waiting for backend LB" >&2
              exit 1
            """
            env.BE_HOST = readFile('/tmp/backend_host').trim()
            echo "Backend host resolved: ${env.BE_HOST}"
          }
        }
      }
    }

    stage('Update frontend script with BACKEND_URL') {
      steps {
        script {
          // Compute BACKEND_URL to use in frontend (http + hostname)
          def backendHost = env.BE_HOST
          if (!backendHost) {
            error "Backend host not found; cannot update frontend"
          }
          // If LB gives only IP, keep http://IP ; default backend port is 80 in service -> root path
          env.BACKEND_URL_FINAL = "http://${backendHost}"
        }

        dir('frontend') {
          sh label: 'Inject BACKEND_URL into script.js', script: """
            set -e
            # backup original
            cp script.js script.js.bak || true
            # replace the BACKEND_URL constant (handles double/single quotes)
            perl -0777 -pe "s{const\\s+BACKEND_URL\\s*=\\s*[^;]+;} {const BACKEND_URL = \\"${env.BACKEND_URL_FINAL}\\";}s" -i script.js
            echo "Updated frontend/script.js with BACKEND_URL=${env.BACKEND_URL_FINAL}"
          """
        }
      }
    }

    stage('Build & Push Frontend Image') {
      steps {
        dir('frontend') {
          sh label: 'Build frontend image', script: """
            set -e
            docker build -t ${FRONTEND_REPO}:${IMAGE_TAG} .
            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
            docker tag ${FRONTEND_REPO}:${IMAGE_TAG} ${FRONTEND_IMAGE}:${IMAGE_TAG}
            docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
            docker tag ${FRONTEND_REPO}:${IMAGE_TAG} ${FRONTEND_IMAGE}:latest
            docker push ${FRONTEND_IMAGE}:latest || true
          """
        }
      }
    }

    stage('Deploy Frontend to EKS') {
      steps {
        withCredentials([file(credentialsId: 'eks-kubeconfig', variable: 'KUBECONFIG_FILE')]) {
          sh label: 'Apply frontend manifests', script: """
            set -e
            export KUBECONFIG=\$KUBECONFIG_FILE

            cat <<EOF | kubectl apply -n ${K8S_NAMESPACE} -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: ${FRONTEND_IMAGE}:${IMAGE_TAG}
        imagePullPolicy: Always
        ports:
        - containerPort: 80
EOF

            cat <<EOF | kubectl apply -n ${K8S_NAMESPACE} -f -
apiVersion: v1
kind: Service
metadata:
  name: frontend-svc
spec:
  type: LoadBalancer
  selector:
    app: frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
EOF

            kubectl rollout status deploy/frontend-deployment -n ${K8S_NAMESPACE} --timeout=120s || true
          """
        }
      }
    }

    stage('Show endpoints') {
      steps {
        withCredentials([file(credentialsId: 'eks-kubeconfig', variable: 'KUBECONFIG_FILE')]) {
          sh label: 'Get service endpoints', script: """
            set -e
            export KUBECONFIG=\$KUBECONFIG_FILE
            echo "Backend Service:"
            kubectl get svc backend-svc -n ${K8S_NAMESPACE} -o wide
            echo "Frontend Service:"
            kubectl get svc frontend-svc -n ${K8S_NAMESPACE} -o wide
          """
        }
      }
    }
  }

  post {
    success {
      echo "Pipeline completed successfully. Frontend and Backend deployed to EKS (namespace: ${K8S_NAMESPACE})."
    }
    failure {
      echo "Pipeline failed. Check logs."
    }
  }
}
