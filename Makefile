build-frontend:
	cd ./frontend && yarn run build

check-app:
ifndef app
	@echo "app is undefined, please specify app=app_name"
	exit 1
endif

deploy-heroku: check-app build-frontend
	cd ./backend && heroku container:push web --app $(app) && heroku container:release web --app $(app)
