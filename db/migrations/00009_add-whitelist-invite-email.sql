
INSERT INTO auth.email_templates(locale, id, title, html, no_html) VALUES
  ('en', 'invite', 'Tou have been invited to <%= app_name %>', E'<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset="utf-8" />\n    <style>\n      body {\n        margin: 0;\n        font-family: sans-serif;\n      }\n    </style>\n  </head>\n\n  <body>\n    <h2>Hello.</h2>\n    <p>You have been invited to <%= app_name %>.</p>\n    <p>If you think this message was not meant for you, you can safely ignore it.</p>\n    <hr />\n    <p>To accept the invitation, click the below link:</p>\n    <a href="<%= url %>/register?email=<%= email %>">\n      <button>Accept invitation</button></a\n    >\n    <p>Thanks,<br />The Team</p>\n  </body>\n</html>', '')
  ON CONFLICT DO NOTHING;