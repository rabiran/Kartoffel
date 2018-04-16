pipeline {
    agent none
    stages {
        stage ('unit-testing') {
            agent {
                label 'backend-dev'
            }
            when {
            expression { BRANCH_NAME !==~ /master/ }
            }            
            steps {
                sh 'sudo service mongod start'
                sh 'npm install'
                sh 'npm test'
            }
        }
        stage ('deploy') {
            agent {
                label 'backend-prod'
            }
            when {
            expression { BRANCH_NAME ==~ /master/ }
            }
            steps {
                sh 'sudo service mongod start'
                sh 'npm install'
                sh 'npm test'
                sh 'npm start &'
            }
        }    
    }
}
