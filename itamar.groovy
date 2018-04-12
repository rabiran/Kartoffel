pipeline {
    agent none
    stages {
        stage ('unit-testing') {
            agent {
                label 'backend-dev'
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
                branch 'master'
            }
            steps {
                sh 'sudo service mongod start'
                sh 'npm install'
                sh 'npm test'
                sh 'npm start'            
        }
    }
}
