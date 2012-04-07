package onedit.client

import java.util.ListResourceBundle

case class Resource(url: String) extends ListResourceBundle {

  def getContents: Array[Array[Object]] = Array(
    Array("url", url)
  )

}
