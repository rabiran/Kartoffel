pipeline {
    agent none
    stages {
        stage ('unit-testing') {
            agent {
                label 'backend-dev'
            }
            steps {
                sh 'npm install'
                sh 'npm test'
            }
        }
    }
}