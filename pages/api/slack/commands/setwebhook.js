import {
  unverifiedRequest,
  getUserRecord,
  t,
  accountsTable,
  sendCommandResponse,
  rebuildScrapbookFor
} from '../../../../lib/api-utils'

export default async (req, res) => {
  if (unverifiedRequest(req))
    return res.status(400).send('Unverified Slack request!')
  else res.status(200).end()

  const { text, user_id, response_url } = req.body
  const args = text.split(' ')
  let webhook = args[0] === 'setwebhook' ? args[1] : args[0]

  const userRecord = await getUserRecord(user_id)

    await accountsTable.update(userRecord.id, {
      webhook: webhook,
    })

    // hang tight while the rebuild happens before giving out the new link
    await sendCommandResponse(
      response_url,
      t('messages.webhook.set')
    )
  }
  res.status(200).end()
}