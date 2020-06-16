import {
  sendCommandResponse,
  accountsTable,
  getUserRecord
} from '../../../../lib/api-utils'

export default async (req, res) => {
  const command = req.body
  if (command.text === '') {
    sendCommandResponse(
      command.response_url,
      'You must specify a domain to link to! e.g. `/setdomain scrap.hackhappyvalley.com`'
    )
  } else {
    const user = await getUserRecord(command.user_id)
    await accountsTable.update(user.id, {
      'Custom Domain': command.text
    })

    const updates = await accountsTable.read({
      filterByFormula: `{Custom Domain} != ''`
    })
    const domainCount = updates.length

    if (domainCount > 50) {
      sendCommandResponse(
        command.response_url,
        `Couldn't set your domain. Only 50 custom domains can be added to a project, and 50 people have already added their custom domains. :/`
      )
    }
    else {
      const vercelFetch = await fetch(
        `https://api.vercel.com/v1/projects/QmbACrEv2xvaVA3J5GWKzfQ5tYSiHTVX2DqTYfcAxRzvHj/alias?teamId=team_gUyibHqOWrQfv3PDfEUpB45J`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.VC_SCRAPBOOK_TOKEN}`
          },
          body: JSON.stringify({
            domain: command.text
          })
        }
      )
        .then(r => r.json())
        .catch(err => {
          console.log(`Error while setting custom domain ${command.text}: ${err}`)
        })
      console.log(vercelFetch)
      if (vercelFetch.error) {
        sendCommandResponse(
          command.response_url,
          `Couldn't set your domain \`${command.text}\`. You can't add a domain if it's already set to another Vercel project. Try again with a different domain.`
        )
      }
      else {
        sendCommandResponse(
          command.response_url,
          `Custom domain \`${command.text}\` set!
          \n\n*Your next steps*: create a CNAME record in your DNS provider for your domain and point it to \`cname.vercel-dns.com\`.
        \n\nYou're one of 50 people who can add a custom domain during the Summer of Making. There are *${50 - domainCount}* domains spots left.
        `
        )
      }
    }
  }

  res.status(200).end()
}
