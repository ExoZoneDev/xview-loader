# xView Webpack Loader
Convert html files to a series of function calls to be used with the xView framework.

## Usage
```
npm i -D xview-loader
```

In your `webpack.json`
```javascript
  module: {
    loaders: [
      { test: /\.html$/, loader: "xview" }
    ]
  },
```

Then you can simply require any html file
```javascript
require("./view.html");
```