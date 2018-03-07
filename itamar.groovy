pipeline {
    agent none
    stages {
        stage ('unit-test')
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