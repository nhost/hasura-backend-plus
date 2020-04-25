import { Router } from 'express'
import { Strategy, Profile } from '@nicokaiser/passport-apple'
import Boom from '@hapi/boom'
import { PROVIDERS } from '@shared/config'
import { initProvider } from './utils'
import { UserData } from '@shared/types'

const transformProfile = ({ id, name, email, photos }: Profile): UserData => ({
  id,
  email,
  display_name: name ? `${name.firstName} ${name.lastName}` : email,
  avatar_url: photos?.[0].value
})

export default (router: Router): void => {
  const options = PROVIDERS.apple

  // Checks if the strategy is enabled. Don't create any route otherwise
  if (options) {
    if (!options.clientID || !options.teamID || !options.keyID || !options.key) {
      throw Boom.badImplementation(`Missing environment variables for GitHub OAuth.`)
    }

    initProvider(router, 'apple', Strategy, {
      scope: ['name', 'email'],
      transformProfile,
      callbackMethod: 'POST'
    })
  }
}
