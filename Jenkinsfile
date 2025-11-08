pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        FRONTEND_REPO = 'aws3tier-frontend'
        BACKEND_REPO = 'aws3tier-backend'
        ACCOUNT_ID = '290690313212'
        DOCKER_SERVER = '10.0.1.27'  // your Docker EC2 host
    }

    stages {

        /* ---------------------------------------------------
           Stage 1: Create ECR repositories (safe + idempotent)
        ---------------------------------------------------- */
        stage('Create ECR Repositories') {
            steps {
                script {
                    def repos = [FRONTEND_REPO, BACKEND_REPO]
                    for (repo in repos) {
                        sh """
                        echo "🔍 Checking repository: ${repo}"
                        if aws ecr describe-repositories --repository-names ${repo} --region ${AWS_REGION} >/dev/null 2>&1; then
                            echo "✅ Repository ${repo} already exists — skipping creation."
                        else
                            echo "🚀 Creating repository ${repo}..."
                            aws ecr create-repository --repository-name ${repo} --region ${AWS_REGION}
                        fi
                        """
                    }
                }
            }
        }

        /* ---------------------------------------------------
           Stage 2: Build + Push Frontend Docker Image
        ---------------------------------------------------- */
        stage('Build and Push Frontend Image') {
            steps {
                script {
                    echo "⚙️ Building and pushing frontend Docker image..."
                    sh """
                    ssh -o StrictHostKeyChecking=no ubuntu@${DOCKER_SERVER} '
                        set -e
                        echo "📦 Cloning latest code..."
                        cd /home/ubuntu
                        rm -rf aws-3-tier-architecture-project || true
                        git clone https://github.com/anikettalwekar/aws-3-tier-architecture-project.git
                        cd aws-3-tier-architecture-project/frontend

                        echo "🔐 Logging in to ECR..."
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

                        echo "🏗️ Building Docker image for frontend..."
                        docker build -t ${FRONTEND_REPO}:latest .

                        echo "🏷️ Tagging image..."
                        docker tag ${FRONTEND_REPO}:latest ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${FRONTEND_REPO}:latest

                        echo "🚀 Pushing image to ECR..."
                        docker push ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${FRONTEND_REPO}:latest

                        echo "✅ Frontend image pushed successfully!"
                    '
                    """
                }
            }
        }

        /* ---------------------------------------------------
           Stage 3: Build + Push Backend Docker Image
        ---------------------------------------------------- */
        stage('Build and Push Backend Image') {
            steps {
                script {
                    echo "⚙️ Building and pushing backend Docker image..."
                    sh """
                    ssh -o StrictHostKeyChecking=no ubuntu@${DOCKER_SERVER} '
                        set -e
                        cd /home/ubuntu/aws-3-tier-architecture-project/backend

                        echo "🔐 Logging in to ECR..."
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

                        echo "🏗️ Building Docker image for backend..."
                        docker build -t ${BACKEND_REPO}:latest .

                        echo "🏷️ Tagging image..."
                        docker tag ${BACKEND_REPO}:latest ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_REPO}:latest

                        echo "🚀 Pushing image to ECR..."
                        docker push ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_REPO}:latest

                        echo "✅ Backend image pushed successfully!"
                    '
                    """
                }
            }
        }
    }

    /* ---------------------------------------------------
       Post Actions
    ---------------------------------------------------- */
    post {
        success {
            echo "🎉 Pipeline completed successfully! Both images pushed to ECR."
        }
        failure {
            echo "❌ Pipeline failed. Please check above logs."
        }
    }
}
