module.exports = { 
    "extends": "airbnb-base",
    "rules": {
        "linebreak-style": 0,
        "no-console": 'off',
        "max-len": [
            "error", { 
                "ignoreComments": true,
                "code": 100 
            }
        ]
    }    
 };