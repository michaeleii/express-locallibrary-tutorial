const Book = require("../models/book");
const BookInstance = require("../models/bookinstance");
const Author = require("../models/author");
const Genre = require("../models/genre");
const { body, validationResult } = require("express-validator");

exports.index = async (req, res) => {
	try {
		const [
			book_count,
			book_instance_count,
			book_instance_available_count,
			author_count,
			genre_count,
		] = await Promise.all([
			Book.countDocuments(),
			BookInstance.countDocuments(),
			BookInstance.countDocuments({ status: "Available" }),
			Author.countDocuments(),
			Genre.countDocuments(),
		]);
		const results = {
			book_count,
			book_instance_count,
			book_instance_available_count,
			author_count,
			genre_count,
		};

		res.render("index", {
			title: "Local Library Home",
			error: "",
			data: results,
		});
	} catch (err) {
		next(err);
	}
};

// Display list of all books.
exports.book_list = async (req, res, next) => {
	try {
		const list_books = await Book.find({}, "title author")
			.sort({ title: 1 })
			.populate("author");
		res.render("book_list", { title: "Book List", book_list: list_books });
	} catch (err) {
		next(err);
	}
};

// Display detail page for a specific book.
exports.book_detail = async (req, res, next) => {
	try {
		const [book, book_instance] = await Promise.all([
			Book.findById(req.params.id).populate("author").populate("genre"),
			BookInstance.find({ book: req.params.id }),
		]);
		const results = {
			book,
			book_instance,
		};
		if (results.book == null) {
			// No results.
			const err = new Error("Book not found");
			err.status = 404;
			throw err;
		}
		res.render("book_detail", {
			title: results.book.title,
			book: results.book,
			book_instances: results.book_instance,
		});
	} catch (err) {
		next(err);
	}
};

// Display book create form on GET.
// Display book create form on GET.
exports.book_create_get = async (req, res, next) => {
	// Get all authors and genres, which we can use for adding to our book.
	try {
		const [authors, genres] = await Promise.all([Author.find(), Genre.find()]);
		const results = { authors, genres };
		res.render("book_form", {
			title: "Create Book",
			authors: results.authors,
			genres: results.genres,
		});
	} catch (err) {
		next(err);
	}
};

// Handle book create on POST.
exports.book_create_post = [
	// Convert the genre to an array.
	(req, res, next) => {
		if (!Array.isArray(req.body.genre)) {
			req.body.genre =
				typeof req.body.genre === "undefined" ? [] : [req.body.genre];
		}
		next();
	},

	// Validate and sanitize fields.
	body("title", "Title must not be empty.")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("author", "Author must not be empty.")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("summary", "Summary must not be empty.")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
	body("genre.*").escape(),

	// Process request after validation and sanitization.
	async (req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validationResult(req);

		// Create a Book object with escaped and trimmed data.
		const book = new Book({
			title: req.body.title,
			author: req.body.author,
			summary: req.body.summary,
			isbn: req.body.isbn,
			genre: req.body.genre,
		});

		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values/error messages.

			// Get all authors and genres for form.
			try {
				const [authors, genres] = await Promise.all([
					Author.find(),
					Genre.find(),
				]);
				const results = { authors, genres };
				results.genres.forEach((genre) => {
					if (book.genre.includes(genre._id)) {
						genre.checked = "true";
					}
				});
				res.render("book_form", {
					title: "Create Book",
					authors: results.authors,
					genres: results.genres,
					book,
					errors: errors.array(),
				});
			} catch (err) {
				next(err);
			}
			return;
		}

		// Data from form is valid. Save book.
		try {
			const saved_book = await book.save();
			// Successful: redirect to new book record.
			res.redirect(saved_book.url);
		} catch (err) {
			next(err);
		}
	},
];

// Display book delete form on GET.
exports.book_delete_get = async (req, res, next) => {
	try {
		const [book, book_bookinstances] = await Promise.all([
			Book.findById(req.params.id).populate("author"),
			BookInstance.find({ book: req.params.id }).populate("book"),
		]);
		const results = { book, book_bookinstances };

		if (results.book == null) {
			// No results.
			res.redirect("/catalog/books");
		}

		// Successful, so render.
		res.render("book_delete", {
			title: "Delete Book",
			book: results.book,
			book_bookinstances: results.book_bookinstances,
		});
	} catch (err) {
		next(err);
	}
};

// Handle book delete on POST.
exports.book_delete_post = async (req, res, next) => {
	try {
		const [book, book_bookinstances] = await Promise.all([
			Book.findById(req.params.id).populate("author"),
			BookInstance.find({ book: req.params.id }).populate("book"),
		]);
		const results = { book, book_bookinstances };
		if (results.book_bookinstances.length > 0) {
			// Author has books. Render in same way as for GET route.
			res.render("book_delete", {
				title: "Delete Book",
				book: results.book,
				book_bookinstances: results.book_bookinstances,
			});
			return;
		}
		// Author has no books. Delete object and redirect to the list of authors.
		await Book.findByIdAndRemove(req.body.bookid);
		// Success - go to author list
		res.redirect("/catalog/books");
	} catch (err) {
		next(err);
	}
};

// Display book update form on GET.
exports.book_update_get = async (req, res, next) => {
	// Get book, authors and genres for form.
	try {
		const [book, authors, genres] = await Promise.all([
			Book.findById(req.params.id).populate("author").populate("genre"),
			Author.find(),
			Genre.find(),
		]);
		const results = { book, authors, genres };
		if (results.book == null) {
			// No results.
			const err = new Error("Book not found");
			err.status = 404;
			throw err;
		}
		// Success.
		// Mark our selected genres as checked.
		results.genres.forEach((genre) => {
			results.book.genre.forEach((bookGenre) => {
				if (genre._id.toString() === bookGenre._id.toString()) {
					genre.checked = "true";
				}
			});
		});
		res.render("book_form", {
			title: "Update Book",
			authors: results.authors,
			genres: results.genres,
			book: results.book,
		});
	} catch (err) {
		next(err);
	}
};

// Handle book update on POST.
exports.book_update_post = [
	// Convert the genre to an array
	(req, res, next) => {
		if (!Array.isArray(req.body.genre)) {
			req.body.genre =
				typeof req.body.genre === "undefined" ? [] : [req.body.genre];
		}
		next();
	},

	// Validate and sanitize fields.
	body("title", "Title must not be empty.")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("author", "Author must not be empty.")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("summary", "Summary must not be empty.")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
	body("genre.*").escape(),

	// Process request after validation and sanitization.
	async (req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validationResult(req);

		// Create a Book object with escaped/trimmed data and old id.
		const book = new Book({
			title: req.body.title,
			author: req.body.author,
			summary: req.body.summary,
			isbn: req.body.isbn,
			genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
			_id: req.params.id, //This is required, or a new ID will be assigned!
		});

		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values/error messages.

			// Get all authors and genres for form.
			try {
				const [authors, genres] = await Promise.all([
					Author.find(),
					Genre.find(),
				]);
				const results = { authors, genres };
				results.genres.forEach((genre) => {
					if (book.genre.includes(genre._id)) {
						genre.checked = "true";
					}
				});
				res.render("book_form", {
					title: "Update Book",
					authors: results.authors,
					genres: results.genres,
					book,
					errors: errors.array(),
				});
			} catch (err) {
				next(err);
			}
			return;
		}

		// Data from form is valid. Update the record.
		const thebook = await Book.findByIdAndUpdate(req.params.id, book, {});

		// Successful: redirect to book detail page.
		res.redirect(thebook.url);
	},
];
