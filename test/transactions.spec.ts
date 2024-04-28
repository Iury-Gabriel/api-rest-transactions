import { test, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import { app } from '../src/app'
import request from 'supertest'
import { execSync } from 'node:child_process'

describe('Transactions routes', () => {
    beforeAll(async () => {
        execSync('npm run knex migrate:latest')
        await app.ready()
    })
    
    afterAll(async () => {
        await app.close()
    })

    beforeEach(() => {
        execSync('npm run knex migrate:rollback --all')
        execSync('npm run knex migrate:latest')
    })
    
    test('o usuario pode criar nova transação', async () => {
        await request(app.server).post('/transactions').send({
            title: 'New transaction',
            amount: 5000,
            type: 'credit'
        })
        .expect(201)
    })

    test('o usuario pode listar transações', async () => {
        const createTransactionResponse = await request(app.server).post('/transactions').send({
            title: 'New transaction',
            amount: 5000,
            type: 'credit'
        })

        const cookies = createTransactionResponse.get('Set-Cookie')

        if(!cookies) {
            throw new Error('Failed to get cookies')
        }

        const listTransactionsResponse = await request(app.server).get('/transactions').set('Cookie', cookies).expect(200)

        expect(listTransactionsResponse.body.transactions).toEqual([
            expect.objectContaining({
                title: 'New transaction',
                amount: 5000,
            })
        ])
    })

    test('o usuario pode pegar uma transação especifica', async () => {
        const createTransactionResponse = await request(app.server).post('/transactions').send({
            title: 'New transaction',
            amount: 5000,
            type: 'credit'
        })

        const cookies = createTransactionResponse.get('Set-Cookie')

        if(!cookies) {
            throw new Error('Failed to get cookies')
        }

        const listTransactionsResponse = await request(app.server).get('/transactions').set('Cookie', cookies).expect(200)

        const id = listTransactionsResponse.body.transactions[0].id

        const getTransactionResponse = await request(app.server).get(`/transactions/${id}`).set('Cookie', cookies).expect(200)

        expect(getTransactionResponse.body.transaction).toEqual(
            expect.objectContaining({
                title: 'New transaction',
                amount: 5000,
            })
        )
    })

    test('o usuario pode pegar o sumario', async () => {
        const createTransactionResponse = await request(app.server).post('/transactions').send({
            title: 'Credit transaction',
            amount: 5000,
            type: 'credit'
        })

        const cookies = createTransactionResponse.get('Set-Cookie')

        if(!cookies) {
            throw new Error('Failed to get cookies')
        }

        await request(app.server).post('/transactions').set('Cookie', cookies).send({
            title: 'Debit transaction',
            amount: 2000,
            type: 'debit'
        })

        if(!cookies) {
            throw new Error('Failed to get cookies')
        }

        const summaryResponse = await request(app.server).get('/transactions/summary')
        .set('Cookie', cookies).expect(200)

        expect(summaryResponse.body.summary).toEqual({
            amount: 3000
        })
    })
})

