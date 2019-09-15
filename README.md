This application was built to demonstrate Caleb Hugo's current level of skill with Node, React, REST api, Mongo DB, and automated testing. The program is a calorie tracker that features:

Account creation,
Account editing,
Manager and admin roles to be added to a user,
Manager ability to edit users,
Admin ability to edit user data and user's meals data,
adding and editing of meals,
adjustment of par daily calories,
green to red color scheme that shows which days the user overate,
filtering meals by time of day,
filtering meals by date,
changing number of entries displayed at a time,
and a user search for admins and managers with the same ability to limit and expand the results.

To install, type "npm run install" into a terminal. Then type "cd client && npm install" to get the node_modules for both client and server-side code. Then create a file called ".env" in the root with the following contents:

username=yourUsername
password=yourPassword
env=dev
database=cluster0-z9z8d.mongodb.net/calorieTracker
TOKEN_SECRET=someRandomChars

You will need to set up your own Mongo DB cluster.

After this is complete, go back to the root folder type "npm run dev" to start both the node server to run the server-side code, and the react server.

Please contact me at calebjedhugo@gmail.com with any questions or opportunities.
