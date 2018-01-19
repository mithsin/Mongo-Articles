//------------------------------
var cheerio = require("cheerio");
var request = require("request");

// First, tell the console what server.js is doing
console.log("\n***********************************\n" +
            "Grabbing every thread name and link\n" +
            "from reddit's webdev board:" +
            "\n***********************************\n");

// Making a request for reddit's "webdev" board. The page's HTML is passed as the callback's third argument
request("http://ezinearticles.com/", function(error, response, html) {


  var $ = cheerio.load(html);

  var results = [];


  $("#recent-article-container").each(function(i, element) {

    var title = $(element).find("h3").find('a').text();
    var link = $(element).find("h3").find('a').attr('href');

    results.push({
      title: title,
      link: link
    });
  });

  // Log the results once you've looped through each of the elements found with cheerio
  console.log(results);
});
