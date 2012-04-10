package onedit.server

import unfiltered.request._

object Content extends Params.Extract(
  "content",
  Params.first ~> Params.nonempty
)
