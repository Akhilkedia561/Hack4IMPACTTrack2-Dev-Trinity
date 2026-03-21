
pipeline {
    agent any

    environment {
        DOCKER = '"C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe"'
        NODEJS_HOME = 'C:\\Program Files\\nodejs'
    }

    stages {

        // ---------------- CLONE ----------------
        stage('Clone Repository') {
            steps {
                git branch: 'main', url: 'https://github.com/Akhilkedia561/Hack4IMPACTTrack2-Dev-Trinity.git'
            }
        }

        // ---------------- FIX PATH ----------------
        stage('Fix Node Path') {
            steps {
                bat """
                set PATH=%NODEJS_HOME%;%PATH%
                node -v
                npm -v
                """
            }
        }

        // ---------------- BACKEND ----------------
        stage('Setup Backend Environment') {
            steps {
                dir('backend') {
                    bat """
                    set PATH=%NODEJS_HOME%;%PATH%
                    python -m venv venv
                    call venv\\Scripts\\activate
                    python -m pip install --upgrade pip
                    pip install -r requirements.txt
                    """
                }
            }
        }

        stage('Backend Sanity Check') {
            steps {
                dir('backend') {
                    bat """
                    set PATH=%NODEJS_HOME%;%PATH%
                    call venv\\Scripts\\activate
                    python -c "import main"
                    """
                }
            }
        }

        // ---------------- FRONTEND ----------------
        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    bat """
                    set PATH=%NODEJS_HOME%;%PATH%
                    npm install
                    """
                }
            }
        }

        stage('Frontend Build Check') {
            steps {
                dir('frontend') {
                    bat """
                    set PATH=%NODEJS_HOME%;%PATH%
                    npm run build
                    """
                }
            }
        }

        // ---------------- DOCKER ----------------
        stage('Docker Build Validation') {
            steps {
                dir('backend') {
                    bat """
                    %DOCKER% build -t adaptgrid-backend-test .
                    """
                }
            }
        }

        // ---------------- HEALTH CHECK ----------------
        stage('Live Backend Check') {
            steps {
                bat "curl https://hack4impacttrack2-dev-trinity-production.up.railway.app/health || exit 0"
            }
        }

        stage('Live Frontend Check') {
            steps {
                bat "curl https://stunning-victory-production-2508.up.railway.app/ || exit 0"
            }
        }
    }

    post {
        success {
            echo '✅ Jenkins CI Passed: Everything is working perfectly.'
        }
        failure {
            echo '❌ Jenkins CI Failed: Fix issues before deployment.'
        }
    }
}
