export class CreateNotificationDto {
  userId: string
  type: string
  title: string
  content: string
  relatedOrderId?: string
  relatedDemandId?: string
}
