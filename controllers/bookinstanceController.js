const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = async (req, res, next) => {
	try {
		const list_bookinstances = await BookInstance.find().populate("book");
		res.render("bookinstance_list", {
			title: "Book Instance List",
			bookinstance_list: list_bookinstances,
		});
	} catch (err) {
		next(err);
	}
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = async (req, res, next) => {
	try {
		const bookinstance = await BookInstance.findById(req.params.id).populate(
			"book"
		);
		if (bookinstance == null) {
			// No results.
			const err = new Error("Book copy not found");
			err.status = 404;
			throw err;
		}
		// Successful, so render.
		res.render("bookinstance_detail", {
			title: `Copy: ${bookinstance.book.title}`,
			bookinstance,
		});
	} catch (err) {
		next(err);
	}
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = async (req, res, next) => {
	try {
		const books = await Book.find({}, "title");
		// Successful, so render.
		res.render("bookinstance_form", {
			title: "Create BookInstance",
			book_list: books,
		});
	} catch (err) {
		next(err);
	}
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
	// Validate and sanitize fields.
	body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
	body("imprint", "Imprint must be specified")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("status").escape(),
	body("due_back", "Invalid date")
		.optional({ checkFalsy: true })
		.isISO8601()
		.toDate(),

	// Process request after validation and sanitization.
	async (req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validationResult(req);

		// Create a BookInstance object with escaped and trimmed data.
		const bookinstance = new BookInstance({
			book: req.body.book,
			imprint: req.body.imprint,
			status: req.body.status,
			due_back: req.body.due_back,
		});

		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values and error messages.
			try {
				const books = await Book.find({}, "title");

				// Successful, so render.
				res.render("bookinstance_form", {
					title: "Create BookInstance",
					book_list: books,
					selected_book: bookinstance.book._id,
					errors: errors.array(),
					bookinstance,
				});
			} catch (err) {
				next(err);
			}

			return;
		}

		// Data from form is valid.
		try {
			const saved_bookinstance = await bookinstance.save();
			res.redirect(saved_bookinstance.url);
		} catch (err) {
			next(err);
		}
	},
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = async (req, res, next) => {
	try {
		const [bookinstance] = await Promise.all([
			BookInstance.findById(req.params.id).populate("book"),
		]);

		const results = { bookinstance };

		if (bookinstance == null) {
			// No results.
			const err = new Error("Book copy not found");
			err.status = 404;
			throw err;
		}
		// Successful, so render.
		res.render("bookinstance_delete", {
			title: "Delete Book-Instance",
			bookinstance: results.bookinstance,
		});
	} catch (err) {
		next(err);
	}
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = async (req, res, next) => {
	try {
		await BookInstance.findByIdAndRemove(req.body.bookinstanceid);
		// Success - go to bookinstance list
		res.redirect("/catalog/bookinstances");
	} catch (err) {
		next(err);
	}
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = async (req, res, next) => {
	try {
		const [book_instance, books] = await Promise.all([
			BookInstance.findById(req.params.id).populate("book"),
			Book.find({}, "title"),
		]);
		const results = { book_instance, books };
		res.render("bookinstance_form", {
			title: "Update BookInstance",
			selected_book: results.book_instance.book._id,
			selected_status: results.book_instance.status,
			bookinstance: results.book_instance,
			book_list: results.books,
		});
	} catch (err) {
		next(err);
	}
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
	// Validate and sanitize fields.
	body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
	body("imprint", "Imprint must be specified")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("status").escape(),
	body("due_back", "Invalid date")
		.optional({ checkFalsy: true })
		.isISO8601()
		.toDate(),

	// Process request after validation and sanitization.
	async (req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validationResult(req);

		// Create a BookInstance object with escaped and trimmed data.
		const bookinstance = new BookInstance({
			book: req.body.book,
			imprint: req.body.imprint,
			status: req.body.status,
			due_back: req.body.due_back,
			_id: req.params.id,
		});

		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values and error messages.
			try {
				const books = await Book.find({}, "title");

				// Successful, so render.
				res.render("bookinstance_form", {
					title: "Update BookInstance",
					book_list: books,
					selected_book: bookinstance.book._id,
					errors: errors.array(),
					bookinstance,
				});
			} catch (err) {
				next(err);
			}

			return;
		}

		// Data from form is valid.
		try {
			const thebookinstance = await BookInstance.findByIdAndUpdate(
				req.params.id,
				bookinstance,
				{}
			);
			res.redirect(thebookinstance.url);
		} catch (err) {
			next(err);
		}
	},
];
