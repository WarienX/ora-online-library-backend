import { Resend } from 'resend';

const env = process.env;
const resend = new Resend(env[ 'RESEND_API_KEY' ]);


export const sendEmail = async ( subject: string, html: string, to?: string[] ) => {
    await resend.emails.send({
        from: 'tech@oraworldschool.com',
        cc: 'tech@oraworldschool.com',
        to: to, // ['dsilva.osborne@gmail.com']
        subject,
        html
    });
}