// pages/api/test.ts
import { NextApiRequest, NextApiResponse } from 'next'

import { withPageRouterHighlight } from '@/app/utils/page-router-highlight.config'
import { z } from 'zod'

export default withPageRouterHighlight(async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const success = z.enum(['true', 'false']).parse(req.query.success)

	console.info('Here: /pages/api/test.ts 🤗🤗🤗', { success })

	if (success === 'true') {
		res.send('Success: /pages/api/test.ts')
	} else {
		throw new Error('Error: /pages/api/test.ts (Page Router)')
	}
})
