import express from 'express'
import bodyParser from 'body-parser'
import {handleMessage} from './bot.js'
import config from './../config.js'

const facebookConfig = {
    pageAccessToken: config.pageAccessToken,
    validationToken: config.validationToken,
}

const app = express()
app.set('port', process.env.PORT || config.port || 5000)
app.use(bodyParser.json())

app.get('/webhook', (req, res) => {

    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === facebookConfig.validationToken) {
        console.log('Validating webhook')
        res.status(200).send(req.query['hub.challenge'])
        //console.log(JSON.stringify(res));
    } else {
        console.error('Failed validation. Make sure the validation tokens match.')
        res.sendStatus(403)
    }
})

app.post('/webhook', (req, res) => {
    var message = JSON.stringify(req.body)
    handleMessage(message)
})

app.listen(app.get('port'), () => {
    console.log('Our bot is running on port', app.get('port'))
})
