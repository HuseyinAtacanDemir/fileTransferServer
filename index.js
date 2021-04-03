require('dotenv').config()

const express = require('express')
const fileUpload = require('express-fileupload')
const cors = require('cors');

const path = require('path')
const { createWriteStream, readFileSync, unlink, statSync } = require('fs');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const db = require('./database/mysql')

const cron = require('node-cron');
const { resolve } = require('path');

const PORT = process.env.PORT
const JWT_SECRET = process.env.JWT_SECRET

const getFile = token => {
    try {
        if (token) return jwt.verify(token, JWT_SECRET)
        return null
    } catch (error) {
        return null
    }
}

const app = express()
app.use(cors())
app.use(fileUpload())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const deleteFile = async (fileName) => {
    console.log('fileName :>> ', fileName);
    return new Promise((res, rej) => {
        unlink(path.resolve(__dirname + '/files/' + fileName), (err) => {
            if (err) rej(err)
            db('file_links')
                .delete()
                .where('file_path', '=', fileName)
                .then((data) => {
                    res(data)
                })
                .catch(err => rej(err))
        })
    })
}

const deleteExpiredFiles = async () => {
    const date = new Date();
    const fileLinks = await db.select('*').from('file_links').catch(err => { throw new Error(err) })

    if (fileLinks.length === 0) {
        console.log('no files present in system');
        return;
    }

    const fileDeletionRequests = fileLinks.map(({ id, file_path, jwt, email_from, email_to, created_at }) => (
        new Promise((resolve, reject) => {
            const file = getFile(jwt)
            if (!file) {deleteFile(file_path).then(data => {
                resolve(console.log(`deleted file: ${" id: "+ id +" file: "+ file_path +" from: "+ email_from +" to: "+ email_to +" created: "+ created_at}`))
            })}else{
                reject(`${file.fileName} still active`)
            }

            
        }).catch(err => {
            console.log(err)
        })
    ))
    Promise.all(fileDeletionRequests).then((data) => { console.log(`${data} Files in expired paths are deleted at ${date.toISOString()}`) })
}
cron.schedule('*/1 * * * *', () => {
    console.log('starting deleting inactive files')
    deleteExpiredFiles()
    console.log('deleting files')
})
const createFileRoute = (fileName, expiry) => {
    const token = jwt.sign(
        { fileName },
        process.env.JWT_SECRET,
        { expiresIn: expiry }
    )
    return token
}


app.post('/login', async (req, res) => {
    const user = await db.select('*').from('users').where('email', '=', req.email)
    if (!user[0]) {
        res.json([{ error: 'No such user' }])
        throw new Error("User with that email does not exist")
    }

    const isValid = await bcrypt.compare(req.password, user[0].pass)
    if (!isValid) {
        res.json([{ error: 'Incorrect password' }])
        throw new Error('Incorrect Password')
    }

    const token = jsonwebtoken.sign(
        { id: user[0].id, email: user[0].email },
        process.env.JWT_SECRET,
        { expiresIn: '30m' }
    )
    res.json([{
        token: `Bearer ${token}`
    }])

})

app.get('/dashboard', async (req, res) => {
    //const { id, email } = jsonwebtoken.verify(req.headers.Authorization.replace('Bearer ', ''));
    const id = 1
    const email = 1
    if (id && email) {
        const fileData = await db.select('*').from('file_links').catch(err => { throw new Error(err) })
        res.json(fileData)
    } else {
        res.json([{ error: 'Please sign in' }])
    }

})

app.get('/upload', (req, res) => {
    res.send("<html><body><form ref='uploadForm' id='uploadForm' action='http://localhost:4000/upload' method='post' encType='multipart/form-data'> <label for='expiry'>Expiration Duration</label><input type='text' name='expiry' /><label for='email_from'>Email From</label><input type='email' name='email_from' /><label for='email_to'>Email To</label><input type='email' name='email_to' /><label for='file'>File</label><input type='file' name='file' /><input type='submit' value='Upload!' /></form></body></html>")
})

app.post('/upload', (req, res) => {

    // const { id, email } = jsonwebtoken.verify(req.headers.Authorization.replace('Bearer ', ''));

    // if (!id || !email)
    //     throw new Error('You are not authenticated')
    try {
        let sampleFile;
        let uploadPath;

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }

        // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
        sampleFile = req.files.file;
        uploadPath = __dirname + '/files/' + sampleFile.name;

        // Use the mv() method to place the file somewhere on your server
        sampleFile.mv(uploadPath, function (err) {
            if (err)
                return res.status(500).send(err);

            const fileRouteToken = createFileRoute(sampleFile.name, req.body.expiry)

            db('file_links')
                .insert(
                    {
                        file_path: sampleFile.name,
                        jwt: fileRouteToken,
                        email_from: req.body.email_from,
                        email_to: req.body.email_to
                    })
                .then(() => {
                    res.json([{
                        message: 'File uploaded!',
                        fileRoute: fileRouteToken
                    }]);
                })
                .catch(err => { throw new Error(err) })

        });



    } catch (error) {
        throw new Error(err.message)
    }

})

app.get('/delete/:jwt',  (req, res) => {
    try {
        const { fileName } = getFile(req.params.jwt);
        console.log(fileName)
        if (fileName) {
             deleteFile(fileName)
                .then(msg => {
                    console.log(msg)
                    res.send(`${fileName} deleted succesfully`)
                })
                .catch(err => {
                    console.log(err)
                    res.send(err.message)
                })
        } else {
            res.send('file does not exist')
        }

    } catch (error) {

        res.json([{
            anan: "anan"
        }])
    }
})
app.get('/download/:jwt', (req, res) => {
    //console.log(req)
    try {
        const { fileName, route } = getFile(req.params.jwt);
        console.log(fileName)
        if (fileName && !route) {
            res.sendFile(path.join(__dirname, 'files', fileName))
        } else if (route && !fileName) {
            res.send('hello')
        } else if (route && fileName) {
            res.send('hello')
        } else {
            res.send('hello')
        }

    } catch (error) {

        res.json([{
            anan: "anan"
        }])
    }

})


app.listen(PORT, () => {
    console.log(`Server ready at ${process.env.PUBLIC_URL}:${PORT}`);
})