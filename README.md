![GitHub package.json version](https://img.shields.io/github/package-json/v/mcneel/compute.rhino3d.appserver/main?label=version&style=flat-square)
![node-current (scoped)](https://img.shields.io/badge/dynamic/json?label=node&query=engines.node&url=https%3A%2F%2Fraw.githubusercontent.com%2Fmcneel%2Fcompute.rhino3d.appserver%2Fmain%2Fpackage.json&style=flat-square&color=dark-green)

# Context Decoder AI
An attempt using ML to decode the attractiveness of any locality in any city and display results using a node.js server acting as a bridge between ML and compute.rhino3d servers.

## Contents
- **Link to Video Explaining App Functionality**: https://youtu.be/6oAXbdAE1ws
- **Easy to get started**: fork/clone this repo and run it locally for testing the offline app and source files to the online version.
- **Easy to customize**: Add your own datasets pertaining to attrractivity to yield results immediately.

## ML datasets and References

### K-means Clustering:
https://www.alessiovaccaro.com/resources/kmeans.php
https://vitalflux.com/elbow-method-silhouette-score-which-better/
https://www.kaggle.com/abhishekyadav5/kmeans-clustering-with-elbow-method-and-silhouette

###Twitter Hashtag- Sentiment analysis

https://github.com/giuseppegambino/Italian-Sentiment-Analysis-with-Spark/blob/master/tweetSentimentRadici.py

###Google maps API

https://github.com/codingforentrepreneurs/30-Days-of-Python/blob/master/tutorial-reference/Day%2020/Geocoding%20%26%20Places%20API%20with%20Google%20Maps.ipynb
https://www.youtube.com/watch?v=ckPEY2KppHc&list=PLEsfXFp6DpzQjDBvhNy5YbaBx9j-ZsUe6&index=20

## Getting Started
1. Fork this repo
2. Open the local App.gh file to work with the offline app
3. Follow the [Heroku hosting guide](docs/heroku.md) to push your customized AppServer to Heroku for a production web server

## Similar Examples of using Node.js 
https://compute-rhino3d-appserver.herokuapp.com/examples/

To see a sample web application that passes three numbers based on slider positions to the AppServer for solving a grasshopper definition. Results are returned to the web page and new mesh visualizations are created.

----
## Colab Links
 - To be updated soon


## Other Information
- [API Endpoints](docs/endpoints.md) the server supports
- [Client Code](docs/clientcode.md) example for calling the AppServer
