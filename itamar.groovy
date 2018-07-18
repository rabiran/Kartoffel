
pipeline {
    agent none
    stages {
        stage ('unit-testing') {
            agent {
                label 'kartoffel-dev'
            }
            when {
            not { branch 'master' }
            }            
            steps {
                sh 'sudo service mongod start'
                sh 'npm install'
                sh 'npm test'
            }
        }
        stage ('deploy') {
            agent {
                label 'kartoffel-prod'
            }
            when { branch 'master' }
            steps {
                sh 'sudo service mongod start'
                sh 'npm install'
                sh 'npm start &'
            }
        }    
    }
}
