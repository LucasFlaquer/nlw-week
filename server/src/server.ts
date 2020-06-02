import express from 'express';

const app = express();
app.get('/users', (request,response)=>{
    console.log('listagem de usuarios');
    return response.json([
        'Lucas',
        'Gustavo',
        'Diego'
    ]);
})

app.listen(3333);