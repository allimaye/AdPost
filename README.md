# AdPost

Buying and selling used textbooks by posting on Facebook groups has quickly popularized due to its convenience and social outreach. One major barrier for a user to buy/sell on a Facebook group currently is that they have to create a new post every few hours to keep their ad at the top of the group feed (for maximizing views). 

AdPost solves this problem by collecting the information you need to post in your ad, and uses that information to post to your behalf; saving you time! The user can control how often posts are made to Facebook, and the content of their posts (textbook data and pictures). Notable features are an image preview (to show how textbook pictures look when collaged), and a live feed of posts made to Facebook to track the app’s progress (after Submit has been pressed with valid data).

Textbook pictures are collaged on the client side using an HTML5 Canvas, and stored externally using the Imgur API. Posts are made to Facebook using their Javascript SDK and Graph API. The web app is run on a Node.js http server.

Check it out here: https://adpost.herokuapp.com/
