const Author = require("../models/author");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// Display list of all Authors.
exports.author_list = async (req, res, next) => {
	try {
		const list_authors = await Author.find().sort([
			["family_name", "ascending"],
		]);
		res.render("author_list", {
			title: "Author List",
			author_list: list_authors,
		});
	} catch (err) {
		next(err);
	}
};

// Display detail page for a specific Author.
exports.author_detail = async (req, res, next) => {
	try {
		const [author, author_books] = await Promise.all([
			Author.findById(req.params.id),
			Book.find({ author: req.params.id }, "title summary"),
		]);
		const results = {
			author,
			author_books,
		};
		if (results.author == null) {
			// No results.
			const err = new Error("Author not found");
			err.status = 404;
			throw err;
		}
		res.render("author_detail", {
			title: "Author Detail",
			author: results.author,
			author_books: results.author_books,
		});
	} catch (err) {
		next(err);
	}
};

// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
	res.render("author_form", { title: "Create Author" });
};

// Handle Author create on POST.
// Warning: Never validate names using isAlphanumeric()
// (as we have done above) as there are many names that use other character sets.
// We do it here in order to demonstrate how the validator is used,
// and how it can be daisy-chained with other validators and error reporting.
exports.author_create_post = [
	// Validate and sanitize fields.
	body("first_name")
		.trim()
		.isLength({ min: 1 })
		.escape()
		.withMessage("First name must be specified.")
		.isAlphanumeric()
		.withMessage("First name has non-alphanumeric characters."),
	body("family_name")
		.trim()
		.isLength({ min: 1 })
		.escape()
		.withMessage("Family name must be specified.")
		.isAlphanumeric()
		.withMessage("Family name has non-alphanumeric characters."),
	body("date_of_birth", "Invalid date of birth")
		.optional({ checkFalsy: true })
		.isISO8601()
		.toDate(),
	body("date_of_death", "Invalid date of death")
		.optional({ checkFalsy: true })
		.isISO8601()
		.toDate(),
	// Process request after validation and sanitization.
	async (req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values/errors messages.
			res.render("author_form", {
				title: "Create Author",
				author: req.body,
				errors: errors.array(),
			});
			return;
		}
		// Data from form is valid.

		// Create an Author object with escaped and trimmed data.
		const author = new Author({
			first_name: req.body.first_name,
			family_name: req.body.family_name,
			date_of_birth: req.body.date_of_birth,
			date_of_death: req.body.date_of_death,
		});
		const saved_author = await author.save();
		res.redirect(saved_author.url);
	},
];

// Display Author delete form on GET.
exports.author_delete_get = async (req, res, next) => {
	try {
		const [author, author_books] = await Promise.all([
			Author.findById(req.params.id),
			Book.find({ author: req.params.id }),
		]);
		const results = { author, author_books };

		if (results.author == null) {
			// No results.
			res.redirect("/catalog/authors");
		}

		// Successful, so render.
		res.render("author_delete", {
			title: "Delete Author",
			author: results.author,
			author_books: results.author_books,
		});
	} catch (err) {
		next(err);
	}
};

// Handle Author delete on POST.
exports.author_delete_post = async (req, res, next) => {
	try {
		const [author, author_books] = await Promise.all([
			Author.findById(req.body.authorid),
			Book.find({ author: req.body.authorid }),
		]);
		const results = { author, author_books };
		if (results.author_books.length > 0) {
			// Author has books. Render in same way as for GET route.
			res.render("author_delete", {
				title: "Delete Author",
				author: results.author,
				author_books: results.author_books,
			});
			return;
		}
		// Author has no books. Delete object and redirect to the list of authors.
		await Author.findByIdAndRemove(req.body.authorid);
		// Success - go to author list
		res.redirect("/catalog/authors");
	} catch (err) {
		next(err);
	}
};

// Display Author update form on GET.
exports.author_update_get = async (req, res, next) => {
	try {
		const [author] = await Promise.all([Author.findById(req.params.id)]);
		const results = { author };
		if (results.author == null) {
			// No results.
			const err = new Error("Author not found");
			err.status = 404;
			throw err;
		}
		// Success.
		res.render("author_form", {
			title: "Update Author",
			author: results.author,
		});
	} catch (err) {
		next(err);
	}
};

// Handle Author update on POST.
exports.author_update_post = [
	// Validate and sanitize fields.
	body("first_name")
		.trim()
		.isLength({ min: 1 })
		.escape()
		.withMessage("First name must be specified.")
		.isAlphanumeric()
		.withMessage("First name has non-alphanumeric characters."),
	body("family_name")
		.trim()
		.isLength({ min: 1 })
		.escape()
		.withMessage("Family name must be specified.")
		.isAlphanumeric()
		.withMessage("Family name has non-alphanumeric characters."),
	body("date_of_birth", "Invalid date of birth")
		.optional({ checkFalsy: true })
		.isISO8601()
		.toDate(),
	body("date_of_death", "Invalid date of death")
		.optional({ checkFalsy: true })
		.isISO8601()
		.toDate(),
	// Process request after validation and sanitization.
	async (req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values/errors messages.
			res.render("author_form", {
				title: "Update Author",
				author: req.body,
				errors: errors.array(),
			});
			return;
		}
		// Data from form is valid.

		// Create an Author object with escaped and trimmed data.
		const author = new Author({
			first_name: req.body.first_name,
			family_name: req.body.family_name,
			date_of_birth: req.body.date_of_birth,
			date_of_death: req.body.date_of_death,
			_id: req.params.id,
		});
		const theauthor = await Author.findByIdAndUpdate(req.params.id, author, {});
		res.redirect(theauthor.url);
	},
];
