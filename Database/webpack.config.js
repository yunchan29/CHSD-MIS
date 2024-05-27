const path = require('path'); // Add this line to import the path module

module.exports = {
    mode: 'development', // Set the mode to development or production
    entry: './Database/firebase.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'), // Use path.resolve to create an absolute path
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    }
};
