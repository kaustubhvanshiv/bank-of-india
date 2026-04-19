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
            steps {
                echo '=========================================='
                echo 'Stage: Run Test Script'
                echo '=========================================='
                echo 'Running health check validation...'
                echo '🚀 Starting CI/CD Validation Process'
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
                echo 'Building Docker image...'
                sh 'docker build -t bankapp:${BUILD_NUMBER} .'
                echo "Docker image built successfully: bankapp:${BUILD_NUMBER}"
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
