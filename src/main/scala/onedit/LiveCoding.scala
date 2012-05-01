package onedit

import java.util.concurrent.ConcurrentHashMap

import scala.collection.mutable.ConcurrentMap
import scala.collection.JavaConversions._

import org.jboss.netty.channel.ChannelHandlerContext
import org.jboss.netty.channel.ChannelEvent

import unfiltered.request._
import unfiltered.netty.websockets._

import scalaz._
import Scalaz._

object LiveCoding extends Plan with CloseOnException with LiveCoding {

  def intent = {
    case GET(Path(Seg("live" :: Sender(key, sockets)))) => {
      case Open(socket) => {
	receiver(key) = sockets + (ReceiverId(socket) -> socket)
      }
      case Message(socket, Text(content)) =>
      case Close(socket) => {
	receiver(key) = sockets - ReceiverId(socket)
      }
      case Error(_, e) => {
        e.printStackTrace
      }
    }
    case GET(Path(Seg("live" :: filename :: Nil))) => {
      case Open(socket) => {
	val id = SenderId(socket)
	sender += id -> filename -> socket
	socket.send(id.toString)
      }
      case Message(socket, Text(content)) => {
	receiver.get(SenderId(socket) -> filename).foreach(_.values.foreach(_.send(content)))
      }
      case Close(socket) => {
        sender -= SenderId(socket) -> filename
      }
      case Error(_, e) => {
        e.printStackTrace
      }
    }
  }

  def pass = _.sendUpstream(_)

}

trait LiveCoding {

  type SenderId = Int @@ Sender

  type ReceiverId = Int @@ Receiver

  private lazy val id: WebSocket => Int = _.channel.getId.intValue

  def SenderId(socket: WebSocket): SenderId = SenderId(id(socket))

  def SenderId(i: Int): SenderId = Tag[Int, Sender](i)

  def ReceiverId(socket: WebSocket): ReceiverId = ReceiverId(id(socket))

  def ReceiverId(i: Int): ReceiverId = Tag[Int, Receiver](i)

  type Key = (SenderId, String)

  type ReceiverWebSocket = Map[ReceiverId, WebSocket]

  val sender: ConcurrentMap[Key, WebSocket] = new ConcurrentHashMap[Key, WebSocket]

  val receiver: ConcurrentMap[Key, ReceiverWebSocket] = new ConcurrentHashMap[Key, ReceiverWebSocket]

  trait Sender

  object Sender {
    def unapply(list: List[String]) = list match {
      case senderId :: filename :: Nil => {
	for {
	  i <- std.string.parseInt(senderId).toOption
	  key = SenderId(i) -> filename
	  if sender.contains(key)
	} yield {
	  key -> receiver.get(key).getOrElse(Map.empty)
	}
      }
      case _ => None
    }
  }

  trait Receiver

}
