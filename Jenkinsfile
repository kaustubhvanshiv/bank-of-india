pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo '=========================================='
                echo 'Stage: Checkout'
                echo '=========================================='
                checkout scm
                echo 'Repository checked out successfully'
            }
        }

        stage('Run Test Script') {
            agent {
                docker {
                    image 'node:20-alpine'
                    reuseNode true
                }
            }
            steps {
                echo '=========================================='
                echo 'Stage: Run Test Script'
                echo '=========================================='
                echo 'Running health check validation...'
                echo '🚀 Starting CI/CD Validation Process'
                sh 'node -v'
                sh 'node tests/test.js'
                echo 'Test script completed successfully'
            }
        }

        stage('Docker Build') {
            when {
                branch 'main'
            }
            steps {
                echo '=========================================='
                echo 'Stage: Docker Build'
                echo '=========================================='
                echo 'Simulating Docker build (Docker not available inside container)'
                sh 'echo "docker build -t bankapp:${BUILD_NUMBER} ."'
                echo "Docker build simulated successfully"
            }
        }
    }

    post {
        success {
            echo '=========================================='
            echo 'Pipeline: SUCCESS'
            echo '=========================================='
        }
        failure {
            echo '=========================================='
            echo 'Pipeline: FAILED'
            echo '=========================================='
        }
    }
}