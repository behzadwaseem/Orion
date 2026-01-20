from app.routes import auth, datasets, images, annotations, prelabel

def register_routes(app):
    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
    app.include_router(images.router, tags=["images"])
    app.include_router(annotations.router, tags=["annotations"])
    app.include_router(prelabel.router, tags=["prelabel"])