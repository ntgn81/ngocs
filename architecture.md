## Overview
We will have a few database tables to store things related to the process.

And a few tasks that are executed continously on predefined intervals to update various things related to the process - such as extract-media-id-from-shortcode, scrape-order-comments, extract-email-and-order-items, send-email, validate-address,...

Might be overly complicated, but I think this separate things out to separate areas that can be worked on independently.

## Database
To store sale posts and order comments. Here are the tables

##### `Sales`
Stores the ids of instagram sale posts, with just one column.
- `igMediaId` -  instagram media id of the post. We do need this to link to the orders table
- `igMediaShortCode` - instagram media short code of the post - extracted from the url itself: [https://instagram.com/p/**`28yy9oRb9O`**](https://instagram.com/p/28yy9oRb9O).

I just noticed that Instagram API has a new endpoint : `/media/shortcode/{the-short-code}/`, which is much easier to retrieve than having to dig around the html source: [The post](https://instagram.com/p/28yy9oRb9O) => [The API](https://api.instagram.com/v1/media/shortcode/28yy9oRb9O?client_id=42308c8fb4fc4388beaa7a1406983200)

##### `Orders`
Stores the orders with their statuses and details, has the following columns:
- `igMediaId` - instagram media id of the corresponding sale post
- `sourceComment` - the source comment, stored as is, that came from Instagram API
  - created_time
  - text
  - id
  - from
    - username
    - profile_picture
    - id
    - full_name
- `email` - the email extracted from comments
- `address` - 
- `items` - the requested items, a dictionary/hash of item color + quantity
- `lastModifiedDate` - last time an action has been performed on the order. Can be used to re-send emails, among other things.
- `state` - state of the order, can be of the following values
  1. **scraped** - just pulled down from Instagram API, with just `igMediaId|sourceComment` fields populated.
  2. **pending-details-validation** - parsed out email and ordered item from comment's text. Awaiting admin to validate the order details
  3. **not-valid** - this comment is not an order - doesn't have email
  4. **details-validated** - order's details are validated by admin (making sure email/ordered item were extracted out correctly from comment's text)
  5. **awaiting-address-reply** - first email sent to user, now waiting for their reply with shipping address
  6. **shopping-cart-link-sent** - received address from user, created celery link, emailed the link back to user
- `gmail-conversiontion-id` - the id of gmail converssation - used to keep checking if user has replied to our email

### Tasks
We will have multiple tasks, each responsible just for a part of the process, moving the order from one state to another based on verious events (new comments on instagram, admin validated email/order, received email reply from customer, ...)

##### Scrape comments (every hour)
Creates orders based on comments
- Gets the sale posts from `Sales` table
- Get comments on sale posts
- Create entry in `Orders` table with `state=scraped`

Limitations
- Instagram API only returns last 150 comments
- Can only call 'instagramapi/media/comments' 15 times per hour (might be able to increase to 60 if using authenticated route, gotta figure out how)

##### Extract email/order (every 5 mins or less)
State change: `scraped` => `pending-details-validation` or `not-valid`
- Get all `Orders` with `state=scraped`
- Populate `order.email` and `order.items` from `sourceComment.text`
- Set `state=pending-details-validation` if valid email found
- Set `state=not-valid` if no email found in comment

##### Send initial email (every 5 mins or less)
State change: `details-validated` => `awaiting-address-reply`
- Get all `Orders` with `state=details-validated`
- Use Gmail API to send email to the email on order
- Update `gmail-conversation-id`

##### Check for reply with address (every 5 mins or less)
State change if email received: `awaiting-address-reply` => `shopping-cart-link-sent`
- Query Gmail API for a reply on `gmail-conversation-id`. Do nothing if no emails. Continue to next step if email received.
- Go to Google Maps API to validate address
- Populate order.address with correct address
- Create Celery shopping cart link
- Reply back to customer with celery link above
- Set `state=shopping-cart-link-sent`






 
    


