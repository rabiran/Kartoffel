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
                sh 'NODE_ENV=dev MONGODB_TEST_URI=mongodb://localhost:27017/kartoffel_test SESSION_SECRET=just_an_exampl npm test'
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
