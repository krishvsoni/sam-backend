import express from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import cors from 'cors';
import gql from 'graphql-tag';
import { print } from 'graphql';
import cron from "node-cron";
import Process from './model.js';
import nodemailer from 'nodemailer'
import connectToDB from './mongo.js';
import { spawn } from '@permaweb/aoconnect';
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
app.post('/getInfo', async (req, res) => {
  console.log(req.body);
  const { processid } = req.body;
  try {
    const response = await axios.post(
      `https://cu32.ao-testnet.xyz/dry-run?process-id=${processid}`,
      {
        Owner: '123456789',
        Target: processid,
        Tags: [
          {
            name: 'Action',
            value: 'Info'
          }
        ]
      },
      {
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          'origin': 'null',
          'priority': 'u=1, i',
          'referer': 'https://www.ao.link/',
          'sec-ch-ua': '"Opera";v="111", "Chromium";v="125", "Not.A/Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error making the request');
  }
});

app.get('/getMessages/:entity', async (req, res) => {
  const entity = req.params.entity;
  try {

    const response = await axios.post(
      'https://arweave-search.goldsky.com/graphql',
      {
        query: `query ($entityId: String!, $limit: Int!, $sortOrder: SortOrder!, $cursor: String) {
                          transactions(
                            sort: $sortOrder
                            first: $limit
                            after: $cursor
                            recipients: [$entityId]
                          ) {
                            count
                            ...MessageFields
                            __typename
                          }
                        }
                        fragment MessageFields on TransactionConnection {
                          edges {
                            cursor
                            node {
                              id
                              recipient
                              block {
                                timestamp
                                height
                                __typename
                              }
                              ingested_at
                              tags {
                                name
                                value
                                __typename
                              }
                              data {
                                size
                                __typename
                              }
                              owner {
                                address
                                __typename
                              }
                              __typename
                            }
                            __typename
                          }
                          __typename
                        }`,
        variables: {
          cursor: "",
          entityId: entity,
          limit: 25,
          sortOrder: "HEIGHT_DESC"
        }
      },
      {
        headers: {
          'accept': 'application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          'origin': 'https://www.ao.link',
          'priority': 'u=1, i',
          'referer': 'https://www.ao.link/',
          'sec-ch-ua': '"Opera";v="111", "Chromium";v="125", "Not.A/Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0'
        }
      }
    );
    const filteredData = response.data.data.transactions.edges.map(edge => ({
      id: edge.node.id,
      tags: edge.node.tags,
      ownerAddress: edge.node.owner.address
    }));
    // const out=response.data

    res.json({filteredData});
  } catch (error) {
    console.error(error);
    res.status(500).send('Error making the request');
  }
});
app.get('/getOwner/:msgid', async (req, res) => {
  const msgid = req.params.msgid;

  try {
    const response = await axios.post(
      'https://arweave-search.goldsky.com/graphql',
      {
        query: `query ($id: ID!) {
          transactions(ids: [$id]) {
            ...MessageFields
            __typename
          }
        }

        fragment MessageFields on TransactionConnection {
          edges {
            cursor
            node {
              id
              recipient
              block {
                timestamp
                height
                __typename
              }
              ingested_at
              tags {
                name
                value
                __typename
              }
              data {
                size
                __typename
              }
              owner {
                address
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
        `,
        variables: {
          id: msgid
        }
      },
      {
        headers: {
          'accept': 'application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          'origin': 'https://www.ao.link',
          'priority': 'u=1, i',
          'referer': 'https://www.ao.link/',
          'sec-ch-ua': '"Opera";v="111", "Chromium";v="125", "Not.A/Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0'
        }
      }
    );
    const ownerAddress = response.data.data.transactions.edges[0]?.node?.owner?.address;
    // const owner=response.data.transactions.edges[0].owner.address;
    res.json(ownerAddress);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error making the request');
  }
});
app.post('/getResults', async (req, res) => {
  const { processId, messageIds } = req.body;
  let results = [];

  for (let i = 0; i < messageIds.length; i++) {
    try {
      const response = await axios.post(
        'https://arweave-search.goldsky.com/graphql',
        {
          query: `query ($id: ID!) {
            transactions(ids: [$id]) {
              ...MessageFields
              __typename
            }
          }

          fragment MessageFields on TransactionConnection {
            edges {
              cursor
              node {
                id
                recipient
                block {
                  timestamp
                  height
                  __typename
                }
                ingested_at
                tags {
                  name
                  value
                  __typename
                }
                data {
                  size
                  __typename
                }
                owner {
                  address
                  __typename
                }
                __typename
              }
              __typename
            }
            __typename
          }
          `,
          variables: {
            id: messageIds[i]
          }
        },
        {
          headers: {
            'accept': 'application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            'origin': 'https://www.ao.link',
            'priority': 'u=1, i',
            'referer': 'https://www.ao.link/',
            'sec-ch-ua': '"Opera";v="111", "Chromium";v="125", "Not.A/Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0'
          }
        }
      );

      const outputData = response.data;
      results.push({ messageId: messageIds[i], dataValue: outputData });

      // Wait for a specified interval before sending the next request
      if (i < messageIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2000 ms interval
      }
    } catch (error) {
      console.error(`Error making the request for messageId ${messageIds[i]}:`, error);
      results.push({ messageId: messageIds[i], error: 'Error making the request' });
    }
  }

  res.json({ results });
});

app.get('/getResult/:msgid', async (req, res) => {
  const msgid = req.params.msgid;

  try {
    const response = await axios.post(
      'https://arweave-search.goldsky.com/graphql',
      {
        query: `query ($id: ID!) {
          transactions(ids: [$id]) {
            ...MessageFields
            __typename
          }
        }

        fragment MessageFields on TransactionConnection {
          edges {
            cursor
            node {
              id
              recipient
              block {
                timestamp
                height
                __typename
              }
              ingested_at
              tags {
                name
                value
                __typename
              }
              data {
                size
                __typename
              }
              owner {
                address
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
        `,
        variables: {
          id: msgid
        }
      },
      {
        headers: {
          'accept': 'application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          'origin': 'https://www.ao.link',
          'priority': 'u=1, i',
          'referer': 'https://www.ao.link/',
          'sec-ch-ua': '"Opera";v="111", "Chromium";v="125", "Not.A/Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0'
        }
      }
    );
    const outputData = response.data
    // const dataValue = outputData.match(/Data = (.*)/)[1];

    res.json({ dataValue: outputData });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error making the request');
  }
});

app.post('/getProcesses', async (req, res) => {
  const { address } = req.body;

  // Construct the GraphQL query
  const query = gql`
      query {
        transactions(
          owners: "${address}", 
          tags: [{ name: "Data-Protocol", values: ["ao"] }, { name: "Type", values: ["Process"] }],
          first: 999
        ) {
          edges {
            node {
              id
              tags {
                name
                value
              }
            }
          }
        }
      }
    `;

  try {
    const response = await axios.post(
      'https://arweave-search.goldsky.com/graphql',
      {
        query: print(query),
      },
      {
        headers: {
          'accept': 'application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          'origin': 'https://www.ao.link',
          'priority': 'u=1, i',
          'referer': 'https://www.ao.link/',
          'sec-ch-ua': '"Opera";v="111", "Chromium";v="125", "Not.A/Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error making the request');
  }
});
app.post('/setupCRON', async (req, res) => {
  await connectToDB();
  const { entity, interval } = req.body; // expecting entity and interval in request body

  try {
    // Function to fetch messages and store them in the database
    const fetchAndStoreMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/getMessages/${entity}`);
        const messages = response.data.filteredData;

        // Check if messages is an array
        if (!Array.isArray(messages)) {
          throw new Error('Expected an array of messages');
        }

        // Extract message IDs and tags from the fetched messages
        const messagesWithTags = messages.map(msg => ({
          messageId: msg.id,
          tags: msg.tags.map(tag => tag.value)
        }));

        // Find or create a process document based on entity (processId)
        const process = await Process.findOneAndUpdate(
          { processId: entity },
          {
            $set: {
              messagesWithTags: messagesWithTags
            }
          },
          { upsert: true, new: true }
        );

        console.log(`Messages stored for entity: ${entity}`);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    // Fetch and store messages immediately upon setup
    await fetchAndStoreMessages();

    // Set up CRON job to run at specified intervals
    cron.schedule(interval, fetchAndStoreMessages);

    res.status(200).send(`CRON job setup to fetch messages for entity: ${entity} at interval: ${interval}`);
  } catch (error) {
    console.error('Error setting up CRON job:', error);
    res.status(500).send('Error setting up CRON job');
  }
});

export const generateHTMLReport = (process) => {
  const messages = process.messagesWithTags;
  let htmlContent = `
      <html>
      <head>
          <title>CRON Job Report</title>
      </head>
      <body>
          <h1>Report for Process ID: ${process.processId}</h1>
          <ul>
  `;

  messages.forEach(msg => {
      htmlContent += `
          <li>
              <strong>Message ID:</strong> ${msg.messageId} <br>
              <strong>Tags:</strong> ${msg.tags.join(', ')}
          </li>
      `;
  });

  htmlContent += `
          </ul>
      </body>
      </html>
  `;

  return htmlContent;
};

export const sendEmailReport = async (htmlReport, recipientEmail) => {
  const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
          user: 'haardsolanki.itm@gmail.com',
          pass: 'oupl qleh qnee pucl'
      },
  });

  const mailOptions = {
      from: 'SAM ONCHAIN <haardsolanki.itm@gmail.com>',
      to: recipientEmail, // Use the dynamic recipient's email
      subject: 'CRON Job Report',
      html: htmlReport
  };

  try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent with CRON job report');
  } catch (error) {
      console.error('Error sending email:', error);
  }
};

const processAndSendReport = async (processId, recipientEmail) => {
    try {
        const process = await Process.findOne({ processId: processId });
        if (process) {
            // Generate HTML report
            const htmlReport = generateHTMLReport(process);

            // Send email with HTML report
            await sendEmailReport(htmlReport, recipientEmail);

            console.log('Report generated and email sent');
        } else {
            console.log('Process not found');
        }
    } catch (error) {
        console.error('ERROR:', error);
    }
};

const startRecurringTask = async (processId, delayMs, recipientEmail) => {
    await connectToDB();

    const executeTask = async () => {
        await processAndSendReport(processId, recipientEmail);
        setTimeout(executeTask, delayMs);
    };

    executeTask();
};

app.get('/getreport', (req, res) => {
    const { processId, delayTime, email } = req.query;
    console.log(`Process ID: ${processId}, Delay Time: ${delayTime} seconds, Email: ${email}`);

    const delayMs = parseInt(delayTime) * 1000;

    startRecurringTask(processId, delayMs, email);

    res.status(200).send(`Recurring task started for process ID: ${processId} with interval: ${delayTime} seconds and email: ${email}`);
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
