pipeline {
    stages {
        stage ('unit-testing') {
            agent {
                label 'backend-dev'
            }
            steps {
                echo GIT_COMMIT
                echo BUILD_TAG
                sh 'npm install'
                sh 'npm test'
            }
        }
    }
}