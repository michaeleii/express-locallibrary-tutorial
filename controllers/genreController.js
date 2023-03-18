const mongoose = require("mongoose");
const Genre = require("../models/genre");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = async (req, res, next) => {
	try {
		const list_genres = await Genre.find().sort([["name", "ascending"]]);
		res.render("genre_list", {
			title: "Genre List",
			genre_list: list_genres,
		});
	} catch (err) {
		next(err);
	}
};

// Display detail page for a specific Genre.
exports.genre_detail = async (req, res, next) => {
	try {
		const id = new mongoose.Types.ObjectId(req.params.id);
		const [genre, genre_books] = await Promise.all([
			Genre.findById(id),
			Book.find({ genre: id }),
		]);
		const results = {
			genre,
			genre_books,
		};
		if (results.genre == null) {
			// No results.
			const err = new Error("Genre not found");
			err.status = 404;
			throw err;
		}
		// Successful, so render
		res.render("genre_detail", {
			title: "Genre Detail",
			genre: results.genre,
			genre_books: results.genre_books,
		});
	} catch (err) {
		next(err);
	}
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
	res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
	// Validate and sanitize the name field.
	body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

	// Process request after validation and sanitization.
	async (req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validationResult(req);

		// Create a genre object with escaped and trimmed data.
		const genre = new Genre({ name: req.body.name });

		if (!errors.isEmpty()) {
			// There are errors. Render the form again with sanitized values/error messages.
			res.render("genre_form", {
				title: "Create Genre",
				genre,
				errors: errors.array(),
			});
			return;
		} else {
			// Data from form is valid.
			// Check if Genre with same name already exists.
			try {
				const found_genre = await Genre.findOne({ name: req.body.name });
				if (found_genre) {
					// Genre exists, redirect to its detail page.
					res.redirect(found_genre.url);
				} else {
					const saved_genre = await genre.save();
					// Genre saved. Redirect to genre detail page.
					res.redirect(saved_genre.url);
				}
			} catch (err) {
				next(err);
			}
		}
	},
];

// Display Genre delete form on GET.
exports.genre_delete_get = async (req, res, next) => {
	try {
		const [genre, genre_books] = await Promise.all([
			Genre.findById(req.params.id),
			Book.find({ genre: req.params.id }),
		]);
		const results = { genre, genre_books };
		if (results.genre == null) {
			// No results.
			res.redirect("/catalog/genres");
		}
		// Successful, so render.
		res.render("genre_delete", {
			title: "Delete Genre",
			genre: results.genre,
			genre_books: results.genre_books,
		});
	} catch (err) {
		next(err);
	}
};

// Handle Genre delete on POST.
exports.genre_delete_post = async (req, res, next) => {
	try {
		const [genre, genre_books] = await Promise.all([
			Genre.findById(req.body.genreid),
			Book.find({ genre: req.body.genreid }),
		]);
		const results = { genre, genre_books };
		if (results.genre_books.length > 0) {
			// genre has books. Render in same way as for GET route.
			res.render("genre_delete", {
				title: "Delete genre",
				genre: results.genre,
				genre_books: results.genre_books,
			});
			return;
		}
		// genre has no books. Delete object and redirect to the list of genres.
		await Genre.findByIdAndRemove(req.body.genreid);
		// Success - go to genre list
		res.redirect("/catalog/genres");
	} catch (err) {
		next(err);
	}
};

// Display Genre update form on GET.
exports.genre_update_get = async (req, res, next) => {
	try {
		const [genre] = await Promise.all([Genre.findById(req.params.id)]);
		const results = { genre };
		if (results.genre == null) {
			// No results.
			const err = new Error("Genre not found");
			err.status = 404;
			throw err;
		}
		// Success.
		res.render("genre_form", {
			title: "Update Genre",
			genre: results.genre,
		});
	} catch (err) {
		next(err);
	}
};

// Handle Genre update on POST.
exports.genre_update_post = [
	// Validate and sanitize the name field.
	body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

	// Process request after validation and sanitization.
	async (req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validationResult(req);

		// Create a genre object with escaped and trimmed data.
		const genre = new Genre({ name: req.body.name, _id: req.params.id });

		if (!errors.isEmpty()) {
			// There are errors. Render the form again with sanitized values/error messages.
			const [genre] = await Promise.all([Genre.findById(req.params.id)]);
			res.render("genre_form", {
				title: "Update Genre",
				genre,
				errors: errors.array(),
			});
			return;
		} else {
			// Data from form is valid.
			// Check if Genre with same name already exists.
			try {
				const found_genre = await Genre.findOne({ name: req.body.name });
				if (found_genre) {
					throw new Error("Genre already exists");
				} else {
					const thegenre = await Genre.findByIdAndUpdate(
						req.params.id,
						genre,
						{}
					);
					// Genre saved. Redirect to genre detail page.
					res.redirect(thegenre.url);
				}
			} catch (err) {
				next(err);
			}
		}
	},
];
