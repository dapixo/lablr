/**
 * Liste des domaines d'emails temporaires/jetables à bloquer
 * Mise à jour régulière recommandée pour maintenir l'efficacité
 */

export const disposableEmailDomains = new Set([
  // Domaines populaires français
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.nf',
  'jetable.fr.nf',
  'courrier.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'hide.biz.st',
  'mymail.infos.st',

  // Services internationaux très populaires
  '10minutemail.com',
  '10minutemail.net',
  '20minutemail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamail.de',
  'mailinator.com',
  'mailinator.net',
  'mailinator.org',
  'tempmail.org',
  'temp-mail.org',
  'tempmail.net',
  'throwaway.email',
  'throwaway.com',
  'getnada.com',
  'maildrop.cc',
  'mohmal.com',
  'sharklasers.com',
  'grr.la',
  'guerrillamailblock.com',
  'pokemail.net',
  'spam4.me',
  'bccto.me',
  'chacuo.net',
  'disposableemailaddresses.com',
  'emailondeck.com',
  'fakeinbox.com',
  'spamherald.com',
  'spamhole.com',
  'tempmailaddress.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'e4ward.com',
  'mytrashmail.com',
  'mailnesia.com',

  // Autres services populaires
  'dispostable.com',
  'disposeamail.com',
  'disposable.com',
  'spambog.com',
  'spambog.de',
  'spambog.ru',
  'spambox.us',
  'spamcannon.com',
  'spamcannon.net',
  'spamday.com',
  'spamex.com',
  'spamfree24.com',
  'spamfree24.de',
  'spamfree24.eu',
  'spamfree24.net',
  'spamfree24.org',
  'spamgourmet.com',
  'spamgourmet.net',
  'spamgourmet.org',
  'spamhole.com',
  'spaml.com',
  'spaml.de',
  'spamspot.com',
  'speed.1s.fr',
  'tagyourself.com',
  'talkinator.com',
  'twinmail.de',
  'tyldd.com',
  'uggsrock.com',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'wh4f.org',
  'whatiaas.com',
  'whatpaas.com',
  'whatsaas.com',
  'whyspam.me',
  'willselfdestruct.com',
  'xoxy.net',
  'yep.it',
  'yogamaven.com',
  'yuurok.com',
  'zehnminuten.de',
  'zehnminutenmail.de',
  'zetmail.com',
  'zoemail.com',
  'zoemail.net',
  'zoemail.org',

  // Autres domaines temporaires
  'mailtemp.info',
  'temp-mail.io',
  'tempmail.co',
  'tempmail.plus',
  'tempmail.email',
  'temporary-mail.net',
  'temporarymail.com',
  'temporaryforwarding.com',
  'tempr.email',
  'tenminuteemail.com',
  'tenminuteemail.net',
  'tenminuteemail.org',
  'tmail.ws',
  'tmpbox.net',
  'tmpjr.com',
  'tmpmail.net',
  'tmpmail.org',
  'tmails.net',
  'emailfake.com',
  'fake-mail.ml',
  'fakemailgenerator.com',
  'fakemail.net',
  'harakirimail.com',
  'incognitomail.org',
  'instant-email.org',
  'jetable.org',
  'lroid.com',
  'mail-temporaire.fr',
  'mailcatch.com',
  'maildx.com',
  'mailed.ro',
  'mailexpire.com',
  'mailforspam.com',
  'mailfreeonline.com',
  'mailimate.com',
  'mailin8r.com',
  'mailinater.com',
  'mailismagic.com',
  'mailme.lv',
  'mailme24.com',
  'mailnull.com',
  'mailpick.biz',
  'mailrock.biz',
  'mailscrap.com',
  'mailshell.com',
  'mailsiphon.com',
  'mailtemp.info',
  'mailtothis.com',
  'mailzilla.com',
  'mailzilla.org',
  'makemetheking.com',
  'mintemail.com',
  'mytemp.email',
  'netmails.com',
  'netmails.net',
  'neverbox.com',
  'noclickemail.com',
  'nodomain.com',
  'nomail.xl.cx',
  'nomail2me.com',
  'nomorespamemails.com',
  'notmailinator.com',
  'nowmymail.com',
  'objectmail.com',
  'obobbo.com',
  'odaymail.com',
  'oneoffemail.com',
  'onewaymail.com',
  'opayq.com',
  'ordinaryamerican.net',
  'otherinbox.com',
  'ovpn.to',
  'owlpic.com',
  'pancakemail.com',
  'pjkpmail.com',
  'plexolan.de',
  'poofy.org',
  'pookmail.com',
  'proxymail.eu',
  'punkass.com',
  'putthisinyourspamdatabase.com',
  'quickinbox.com',
  'rcpt.at',
  'reallymymail.com',
  'receiveee.com',
  'receiveee.chickenkiller.com',
  'receiveee.com',
  'recipeforfun.info',
  'recode.me',
  'recursor.net',
  'recyclebin.jp',
  'regbypass.com',
  'rejectmail.com',
  'rhyta.com',
  'rklips.com',
  'rmqkr.net',
  'rppkn.com',
  'rtrtr.com',
  'rymsho.ru',
  's0ny.net',
  'safe-mail.net',
  'safersignup.de',
  'safetymail.info',
  'safetypost.de',
  'sandelf.de',
  'saynotospams.com',
  'selfdestructingmail.com',
  'sendspamhere.com',
  'shiftmail.com',
  'shortmail.net',
  'sibmail.com',
  'sinnlos-mail.de',
  'skeefmail.com',
  'slopsbox.com',
  'smashmail.de',
  'smellfear.com',
  'snakemail.com',
  'sneakemail.com',
  'sofimail.com',
  'sofort-mail.de',
  'sogetthis.com',
  'soodonims.com',
  'spam.la',
  'spamavert.com',
  'spambob.com',
  'spambob.net',
  'spambob.org',
  'spamcorptastic.com',
  'spamcowboy.com',
  'spamcowboy.net',
  'spamcowboy.org',
  'spamday.com',
  'spamex.com',
  'spamfighter.cf',
  'spamfighter.ga',
  'spamfighter.gq',
  'spamfighter.ml',
  'spamfighter.tk',
  'spamfree24.com',
  'spamfree24.de',
  'spamfree24.eu',
  'spamfree24.net',
  'spamfree24.org',
  'spamgoes.com',
  'spamgourmet.com',
  'spamgourmet.net',
  'spamgourmet.org',
  'spamherelots.com',
  'spamhereplease.com',
  'spamhole.com',
  'spamify.com',
  'spaminator.de',
  'spamkill.info',
  'spaml.com',
  'spaml.de',
  'spammotel.com',
  'spamobox.com',
  'spamoff.de',
  'spamslicer.com',
  'spamstack.net',
  'spamthis.co.uk',
  'spamthisplease.com',
  'spamtrap.ro',
  'speed.1s.fr',
  'srilankahotel.com',
  'stuffmail.de',
  'super-auswahl.de',
  'supergreatmail.com',
  'supermailer.jp',
  'superrito.com',
  'superstachel.de',
  'suremail.info',
  'tempalias.com',
  'tempe-mail.com',
  'tempemail.biz',
  'tempemail.com',
  'tempemail.net',
  'tempinbox.com',
  'tempinbox.net',
  'tempmail.it',
  'tempmail2.com',
  'tempmaildemo.com',
  'tempmailer.com',
  'tempmailer.de',
  'tempmailid.com',
  'tempmail.de',
  'tempmail.eu',
  'temporarydisposableemail.com',
  'temporaryemail.net',
  'temporaryinbox.com',
  'temporarymailaddress.com',
  'tempthe.net',
  'thanksnospam.info',
  'thankyou2010.com',
  'thecloudindex.com',
  'thisisnotmyrealemail.com',
  'thismail.net',
  'throwawayemailaddresses.com',
  'tinyurl.com',
  'tmail.ws',
  'tmailinator.com',
  'toiea.com',
  'toomail.biz',
  'topranklist.de',
  'tradermail.info',
  'trash-amil.com',
  'trash-mail.at',
  'trash-mail.com',
  'trash-mail.de',
  'trash2009.com',
  'trashdevil.com',
  'trashdevil.de',
  'trashemail.de',
  'trashmail.at',
  'trashmail.com',
  'trashmail.de',
  'trashmail.me',
  'trashmail.net',
  'trashmail.org',
  'trashmail.ws',
  'trashmailer.com',
  'trashymail.com',
  'tyldd.com',
  'uggsrock.com',
  'umail.net',
  'upliftnow.com',
  'uplipht.com',
  'veryrealemail.com',
  'viditag.com',
  'viewcastmedia.com',
  'viewcastmedia.net',
  'viewcastmedia.org',
  'walala.org',
  'walkmail.net',
  'webemail.me',
  'wegwerfemail.de',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'wh4f.org',
  'whatiaas.com',
  'whatpaas.com',
  'whatsaas.com',
  'whyspam.me',
  'willselfdestruct.com',
  'winemaven.info',
  'wronghead.com',
  'wuzup.net',
  'wuzupmail.net',
  'wwwnew.eu',
  'xemaps.com',
  'xents.com',
  'xmaily.com',
  'xoxy.net',
  'yep.it',
  'yogamaven.com',
  'youmailr.com',
  'yourdomain.com',
  'ypmail.webredirect.org',
  'yuurok.com',
  'zehnminuten.de',
  'zehnminutenmail.de',
  'zetmail.com',
  'zoemail.com',
  'zoemail.net',
  'zoemail.org',

  // Nouveaux services populaires 2024
  'tempmail.dev',
  'tempmail.zone',
  'tempmail.plus',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamail.de',
  'sharklasers.com',
  'grr.la',
  'guerrillamailblock.com',
  'spam4.me',
  'bccto.me',
  'chacuo.net',
  '1secmail.com',
  '1secmail.net',
  '1secmail.org',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'superrito.com',
  'teleworm.us',
  'rhyta.com',
  'fakeboxmail.com',
  'faketempmail.com',
  'fakemail.fake',
  'temp-mail.co',
  'emailsensei.com',
  'inboxkitten.com',
  'emailondeck.com',
  'luxusmail.org',
  'proxymail.eu',
  'spamburner.com',
  'tempail.com',
  'tempmailgen.com',
  'fakemailz.com',
  'mail-temp.com'
])

/**
 * Vérifie si un domaine email est dans la liste des domaines jetables
 */
export function isDisposableEmailDomain(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }

  // Extraire le domaine de l'email
  const domain = email.toLowerCase().split('@')[1]
  if (!domain) {
    return false
  }

  return disposableEmailDomains.has(domain)
}

/**
 * Configuration des messages d'erreur standardisés
 */
export const EMAIL_VALIDATION_ERRORS = {
  INVALID_FORMAT: 'Unable to validate email address: invalid format',
  DISPOSABLE_DOMAIN: 'Unable to validate email address: disposable email domain not allowed'
} as const

/**
 * Interface pour le résultat de validation
 */
export interface EmailValidationResult {
  isValid: boolean
  isDisposable: boolean
  domain: string | null
  errorCode?: keyof typeof EMAIL_VALIDATION_ERRORS
}

/**
 * Regex de validation email optimisée (plus stricte)
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * Extrait le domaine d'un email de manière sécurisée
 */
function extractDomain(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null
  }

  const parts = email.toLowerCase().trim().split('@')
  return parts.length === 2 ? parts[1] : null
}

/**
 * Valide un email et vérifie s'il utilise un domaine jetable
 * Version optimisée avec interface améliorée
 */
export function validateEmailDomain(email: string): EmailValidationResult {
  // Validation du type et de la présence
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      isDisposable: false,
      domain: null,
      errorCode: 'INVALID_FORMAT'
    }
  }

  // Validation du format avec regex optimisée
  const trimmedEmail = email.trim()
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return {
      isValid: false,
      isDisposable: false,
      domain: null,
      errorCode: 'INVALID_FORMAT'
    }
  }

  // Extraction du domaine
  const domain = extractDomain(trimmedEmail)
  if (!domain) {
    return {
      isValid: false,
      isDisposable: false,
      domain: null,
      errorCode: 'INVALID_FORMAT'
    }
  }

  // Vérification des domaines jetables
  const isDisposable = disposableEmailDomains.has(domain)

  return {
    isValid: true,
    isDisposable,
    domain,
    ...(isDisposable && { errorCode: 'DISPOSABLE_DOMAIN' as const })
  }
}