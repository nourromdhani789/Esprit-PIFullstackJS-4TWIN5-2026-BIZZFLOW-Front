pipeline {
    agent any
    environment {
        VITE_API_URL = 'http://192.168.220.50:30001'
    }
    stages {
        stage('Install') {
            steps {
                sh 'npm install'
            }
        }
        stage('Test') {
            steps {
                sh 'npm run test -- --coverage --watchAll=false --passWithNoTests'
            }
        }
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    sh '''
                        npx sonarqube-scanner \
                        -Dsonar.projectKey=pi_twin5_front \
                        -Dsonar.sources=src \
                        -Dsonar.tests=src \
                        -Dsonar.test.inclusions=**/*.test.ts,**/*.test.tsx \
                        -Dsonar.exclusions=**/*.test.ts,**/*.test.tsx,**/node_modules/** \
                        -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                        -Dsonar.coverage.exclusions=**/node_modules/**
                    '''
                }
            }
        }
        stage('Build') {
            steps {
                sh 'VITE_API_URL=$VITE_API_URL npm run build'
            }
        }
        stage('Docker Build') {
            steps {
                sh 'docker build --no-cache -t oussemadn/pre-val-frontend:latest .'
            }
        }
        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh 'docker login -u $USER -p $PASS'
                    sh 'docker push oussemadn/pre-val-frontend:latest'
                }
            }
        }
        stage('Trigger CD') {
            steps {
                build job: 'frontend-cd', wait: false
            }
        }
    }
}
