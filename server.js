const express = require('express');
const path = require('path');
const hbars = require('express-handlebars');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const request = require('request');
const logger = require("morgan");
const db = require("./models");


const app = express();
const PORT = process.env.PORT || 3000;

app.use(logger("dev"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));

app.set('views', path.join(__dirname, 'views'));
app.engine("handlebars", hbars({defaultLayout: "main"}));
app.set("view engine", "handlebars");

mongoose.Promise = Promise;

if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI);
}
else {
    mongoose.connect("mongodb://localhost/scraper");
}




let scraped = {};

app.get("/scrape", function (req, res) {

    request("https://www.nytimes.com/section/politics?action=click&pgtype=Homepage&region=TopBar&module=HPMiniNav&contentCollection=Politics&WT.nav=page", function (error, response, html) {
        const $ = cheerio.load(html);

        $(".story-link").each(function (i, element) {

            scraped.headline = $(element).children("div").find("h2").text();
            scraped.link = $(element).attr("href");
            scraped.summary = $(element).children("div").find("p").text();

            db.Article
                .create(scraped)
                .then(function (dbArticle) {
                    res.redirect("/");
                })
                .catch(function (err) {
                   console.log(err);
                   res.send("There is an error");
                })
        });
    });
    // res.redirect("/");
});

app.get("/", function (req, res) {
    db.Article.find({})
        .then(function (articles) {
            res.render("index", {scraped: articles});
        }).catch(function (err) {
        if (err) {
        }
    })
});

app.get("/articles/:id", function (req, res) {
    db.Article.findOne({_id: req.params.id})
        .populate("comment")
        .then(function (articleComment) {
            res.json(articleComment)
        }).catch(function (err) {
        if (err) {
        }
    });
});

app.post("/articles/:id", function (req, res) {
    console.log(req.body);
    db.Comment.create(req.body)
        .then(function (dbComment) {
            return db.Article.findOneAndUpdate({_id: req.params.id}, {$addToSet: {comment: dbComment._id}}, {new: true});
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            if (err) {
                console.log(err);
            }
        })
});

app.listen(PORT, function () {
    console.log(`App running on port ${PORT}!`);
});
