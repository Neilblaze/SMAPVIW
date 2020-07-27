const express = require('express')
const path = require('path')
const { cpus } = require('os')
const { fork } = require('child_process')
const { v4: uuidv4 } = require('uuid')
const PORT =  process.env.PORT || 3030

const app = express()

const cache = {}

const urlQueue = []
const inProgressList = []

const refreshQueue = () => {
  subprocesses.filter(item => !item.busy).forEach(item => {
    if (urlQueue.length) {
      const queueItem = urlQueue.shift()
      inProgressList.push(queueItem)
      item.busy = true
      item.process.send({
        type: 'start',
        data: {
          url: queueItem.url,
          id: queueItem.id
        }
      })
    }
  })
}

const sendJSON = (id, json) => {
  const item = inProgressList.find(item => item.id === id)
  item.res.json(json)
  refreshQueue()
}

const sendError = (id, error) => {
  const item = inProgressList.find(item => item.id === id)
  item.res.sendStatus(500)
  refreshQueue()
}

const handleMessage = index => ({ type, data }) => {
  const messages = {
    complete: ({ json, id }) => {
      subprocesses[index].busy = false
      sendJSON(id, json)
    },
    error: ({ error, id }) => {
      subprocesses[index].busy = false
      sendError(id, error)
    }
  }
  messages[type](data)
}

const subprocesses = Array(cpus().length).fill(0).map((_, index) => {
  const process = fork(path.join(__dirname, 'subprocess.js'))
  process.on('message', handleMessage(index))
  process.on('close', e => console.log('close', e))
  process.on('disconnect', e => console.log('disconnect', e))
  process.on('error', e => console.log('error', e))
  process.on('exit', e => console.log('exit', e))
  
  return {
    index,
    busy: false,
    process
  }
})

app.use('/assets', express.static(path.join(__dirname, '..', 'public', 'assets')))

app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})

app.get('/scan', async (req, res) => {
  const { url } = req.query
  if (cache[url]) {
    return res.json(cache[url])
  }
  urlQueue.push({
    id: uuidv4(),
    res,
    url
  })
  refreshQueue()
})

app.listen(PORT, () => {
  console.log(`Made with ❤️  by Pratyay Banerjee <neilblaze007@gmail.com>`)
  console.log(`Server started at http://localhost:${PORT}`)
})
