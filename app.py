"""Nonogram webapp entry point."""

from pathlib import Path

from flask import Flask, render_template

from nonogram.api import bp as api_bp

PUZZLES_FOLDER = Path(__file__).parent / "nonograms"


def create_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config["PUZZLES_FOLDER"] = str(PUZZLES_FOLDER)

    app.register_blueprint(api_bp)

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/puzzle")
    def puzzle():
        return render_template("puzzle.html")

    return app


if __name__ == "__main__":
    create_app().run(debug=True, port=5001)
