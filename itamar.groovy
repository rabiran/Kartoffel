def gitUrl = 'https://github.com/AllKinds/Kartoffel'

job('Kartoffel-Unit-Testing') {
    scm {
        git(gitUrl)
    }
    triggers {
        scm('*/5 * * * *')
    }
    steps {
        shell('cd /var/lib/jenkins/workspace/Kartofell')
        shell('npm install')
        shell('npm test')
    }
}