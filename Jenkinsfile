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
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
                script {
                    env.IMAGE_TAG = sh(returnStdout: true, script: "git rev-parse --short HEAD || echo latest").trim()
                }
            }
        }

        stage('Load DB Secrets') {
            steps {
                withCredentials([
                    string(credentialsId: 'DB_HOST', variable: 'DB_HOST'),
                    string(credentialsId: 'DB_USER', variable: 'DB_USER'),
                    string(credentialsId: 'DB_PASS', variable: 'DB_PASS'),
                    string(credentialsId: 'DB_NAME', variable: 'DB_NAME')
                ]) {
                    script {
                        env.DB_HOST = DB_HOST
                        env.DB_USER = DB_USER
                        env.DB_PASS = DB_PASS
                        env.DB_NAME = DB_NAME
                    }
                }
            }
        }

        stage('Ensure ECR Repos Exist') {
            steps {
                sh """
                  aws ecr describe-repositories --repository-names ${BACKEND_REPO} --region ${AWS_REGION} || \
                  aws ecr create-repository --repository-name ${BACKEND_REPO} --region ${AWS_REGION}

                  aws ecr describe-repositories --repository-names ${FRONTEND_REPO} --region ${AWS_REGION} || \
                  aws ecr create-repository --repository-name ${FRONTEND_REPO} --region ${AWS_REGION}
                """
            }
        }

        stage('Build & Push Backend Image') {
            steps {
                dir('backend') {
                    sh """
                        docker build -t ${BACKEND_REPO}:${IMAGE_TAG} .
                        aws ecr get-login-password --region ${AWS_REGION} |
                          docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                        docker tag ${BACKEND_REPO}:${IMAGE_TAG} ${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Deploy Backend to EKS') {
            steps {
                withCredentials([file(credentialsId: 'eks-kubeconfig', variable: 'KCFG')]) {
                    sh """
                        export KUBECONFIG=\$KCFG

                        kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

                        cat <<EOF | kubectl apply -n ${K8S_NAMESPACE} -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
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
        env:
        - name: DB_HOST
          value: "${env.DB_HOST}"
        - name: DB_USER
          value: "${env.DB_USER}"
        - name: DB_PASS
          value: "${env.DB_PASS}"
        - name: DB_NAME
          value: "${env.DB_NAME}"
        ports:
        - containerPort: 3000
EOF

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
  - port: 80
    targetPort: 3000
EOF

                        kubectl rollout status deployment/backend -n ${K8S_NAMESPACE} --timeout=180s
                    """
                }
            }
        }

        stage('Get Backend URL') {
            steps {
                withCredentials([file(credentialsId: 'eks-kubeconfig', variable: 'KCFG')]) {
                    script {
                        env.BACKEND_URL = sh(returnStdout: true, script: '''
                            export KUBECONFIG=$KCFG
                            kubectl get svc backend-svc -n cricket -o jsonpath="{.status.loadBalancer.ingress[0].hostname}"
                        ''').trim()
                        echo "Backend URL = http://${env.BACKEND_URL}"
                    }
                }
            }
        }

        stage('Update Frontend BACKEND_URL') {
            steps {
                dir('frontend') {
                    sh """
                        cp script.js script.js.bak || true
                        sed -i 's|const BACKEND_URL = .*|const BACKEND_URL = "http://${BACKEND_URL}";|g' script.js
                    """
                }
            }
        }

        stage('Build & Push Frontend Image') {
            steps {
                dir('frontend') {
                    sh """
                        docker build -t ${FRONTEND_REPO}:${IMAGE_TAG} .
                        aws ecr get-login-password --region ${AWS_REGION} |
                          docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                        docker tag ${FRONTEND_REPO}:${IMAGE_TAG} ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Deploy Frontend to EKS') {
            steps {
                withCredentials([file(credentialsId: 'eks-kubeconfig', variable: 'KCFG')]) {
                    sh """
                        export KUBECONFIG=\$KCFG

                        cat <<EOF | kubectl apply -n ${K8S_NAMESPACE} -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
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
  - port: 80
    targetPort: 80
EOF

                        kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE} --timeout=180s
                    """
                }
            }
        }

        stage('Show URLs') {
            steps {
                withCredentials([file(credentialsId: 'eks-kubeconfig', variable: 'KCFG')]) {
                    sh """
                        export KUBECONFIG=\$KCFG
                        echo "Backend URL:"
                        kubectl get svc backend-svc -n ${K8S_NAMESPACE}
                        echo "Frontend URL:"
                        kubectl get svc frontend-svc -n ${K8S_NAMESPACE}
                    """
                }
            }
        }
    }
}
