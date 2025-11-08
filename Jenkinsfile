pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        FRONTEND_REPO = 'aws3tier-frontend'
        BACKEND_REPO = 'aws3tier-backend'
        ACCOUNT_ID = '290690313212'
    }

    stages {
        stage('Create ECR Repositories') {
            steps {
                script {
                    sh """
                    aws ecr describe-repositories --repository-names ${FRONTEND_REPO} || aws ecr create-repository --repository-name ${FRONTEND_REPO} --region ${AWS_REGION}
                    aws ecr describe-repositories --repository-names ${BACKEND_REPO} || aws ecr create-repository --repository-name ${BACKEND_REPO} --region ${AWS_REGION}
                    """
                }
            }
        }

        stage('Build and Push Frontend Image') {
            steps {
                sshagent (credentials: ['docker-ssh-key']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ubuntu@10.0.1.27 '
                    cd /home/ubuntu &&
                    rm -rf aws-3-tier-architecture-project &&
                    git clone https://github.com/anikettalwekar/aws-3-tier-architecture-project.git &&
                    cd aws-3-tier-architecture-project &&
                    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com &&
                    cd frontend &&
                    docker build -t ${FRONTEND_REPO}:latest . &&
                    docker tag ${FRONTEND_REPO}:latest ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${FRONTEND_REPO}:latest &&
                    docker push ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${FRONTEND_REPO}:latest
                    '
                    """
                }
            }
        }

        stage('Build and Push Backend Image') {
            steps {
                sshagent (credentials: ['docker-ssh-key']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ubuntu@10.0.1.27 '
                    cd /home/ubuntu/aws-3-tier-architecture-project/backend &&
                    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com &&
                    docker build -t ${BACKEND_REPO}:latest . &&
                    docker tag ${BACKEND_REPO}:latest ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_REPO}:latest &&
                    docker push ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_REPO}:latest
                    '
                    """
                }
            }
        }
    }
}
