(function() {
  'use strict';

  angular.module('wordFinder', [])
  .controller('mainController', function($scope, $q, $http, myServices, fileParser) {
    var books = [];
    var syns = [];

    $scope.word = "";
    $scope.getWord = getWord;

    activate();
    function activate() {

      var promises = [
          myServices.getFiles("0608271h.html"),
          myServices.getFiles("w00001.html"),
          myServices.getFiles("w00004.html")
      ];
      $q.all(promises).then(function successHandler(results) {
        var index = 0;
        for (var i = 0; i < results.length; i++) {
          var book = fileParser.parseBooks(results[i][0], results[i][1]);
          books.push(book);
        }
      }, epicFail);

    }

    function getWord() {
      var word = $scope.word || "";
      myServices.getSyns(word).then(function successHandler(response) {
        var synonyms = response.noun.syn;
        synonyms.push(word);
        $scope.books = fileParser.searchWord(books, synonyms);
      }, epicFail);

    }

    function epicFail(response) {
      console.error(response)
    }

  })
  .factory('fileParser', function($http){
    return {
      parseBooks: function(book, fileName) {
        var bookObj = {};
        var title = /(?:<title>)((?:.(?!<\/\1>))+.)(?:<\/title>)/;
        var tagRemoval = book.replace(/(<([^>]+)>)/ig, "");
        bookObj.fileName = fileName;
        bookObj.title = book.match(title)[1];
        bookObj.content = tagRemoval;

        return bookObj;
      },
      searchWord: function(books, words) {
        var matchedItems = [];
        var search = words.join("|") + "(.*)(?=\.)";
        console.log(search)
        var re = new RegExp(search, 'g');

        for (var i = 0; i < books.length; i++) {
          var matchedObj = {};
          matchedObj.file = books[i].fileName;
          matchedObj.title = books[i].title;
          matchedObj.matches = books[i].content.match(re);

          matchedItems.push(matchedObj);
        }
        return matchedItems;
      }
    };
  })
  .service('myServices', function($q, $http) {

    this.getFiles = function(file) {
      var deferred = $q.defer(),
      config = {
        method: 'get',
        url: "../grio/data/" + file
      };
      $http(config)
        .success(function(data) {
          deferred.resolve([data, file]);
        }).error(function(data) {
          deferred.reject(data);
        });
      return deferred.promise;
    };

    this.getSyns = function(word) {
      var deferred = $q.defer(),
      apiKey = "2f79fef34b3bda9918801e189a4006fb/",
      word = word + "/json";
      var config = {
        method: 'get',
        url: "http://words.bighugelabs.com/api/2/" + apiKey + word
      };
      $http(config)
        .success(function(data) {
          deferred.resolve(data);
        }).error(function(data) {
          deferred.reject(data);
        });
      return deferred.promise;
    };
  });
})();
