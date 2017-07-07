// iterate the visits at urlStatistics[shortURL]["visits"] += 1
// log the cookie, timestamp when the link is visitied
// add user_id cookie to "visited by" if it doesn't exist, with an empty array
// at end of for loop push the timestamp onto the user_ID
// call uniqueVisitors(shortURL)
// provide urlStatistics to urls_show
// display the results in urlStatistics



const urlStatistics = {
  "shortURL": {
    visits: 0,
    visitedBy: {},
    uniqueVisitors: 0
  }
}