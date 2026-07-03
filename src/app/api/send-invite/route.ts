import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { to, tripName, inviterName, inviterPhoto, tripId } = await request.json();

        if (!to || !tripName) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

        // HTML Email Template - PROFESSIONAL DESIGN 🎨
        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitación a ${tripName} - CatchMe</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f7; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.08); max-width: 600px;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 48px 40px; text-align: center;">
                            <div style="margin-bottom: 20px;">
                                <img src="${appUrl}/LogoApp.png" alt="CatchMe Logo" style="width: 80px; height: 80px; border-radius: 20px; box-shadow: 0 8px 16px rgba(0,0,0,0.2); object-fit: cover;" />
                            </div>
                            <h1 style="margin: 0 0 8px; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Te invitaron a colaborar</h1>
                            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">En la planificación de un viaje</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            
                            <!-- Inviter Message -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td style="background: #F9FAFB; border-left: 4px solid #4F46E5; padding: 20px 24px; border-radius: 12px;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            ${inviterPhoto ? `<img src="${inviterPhoto}" alt="${inviterName}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; display: inline-block; vertical-align: middle;" />` : ''}
                                            <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6; display: inline-block; vertical-align: middle; padding-left: 12px;">
                                                <strong style="color: #1F2937; font-weight: 600;">${inviterName || 'Un amigo'}</strong> te ha invitado a colaborar en la planificación de:
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Trip Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border-radius: 16px; margin-bottom: 32px; border: 2px solid #C7D2FE;">
                                <tr>
                                    <td style="padding: 28px 32px;">
                                        <p style="margin: 0 0 6px; color: #6366F1; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Viaje</p>
                                        <h2 style="margin: 0; color: #312E81; font-size: 26px; font-weight: 700;">${tripName}</h2>
                                    </td>
                                </tr>
                            </table>

                            <!-- Permissions -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 16px; color: #6B7280; font-size: 14px; font-weight: 600;">Como colaborador podrás:</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px 24px; background: #F9FAFB; border-radius: 12px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="display: inline-block; width: 28px; height: 28px; background: #EEF2FF; border-radius: 8px; text-align: center; line-height: 28px; margin-right: 12px; font-size: 14px;">✓</span>
                                                    <span style="color: #374151; font-size: 15px; font-weight: 500;">Ver el itinerario completo del viaje</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="display: inline-block; width: 28px; height: 28px; background: #EEF2FF; border-radius: 8px; text-align: center; line-height: 28px; margin-right: 12px; font-size: 14px;">✓</span>
                                                    <span style="color: #374151; font-size: 15px; font-weight: 500;">Agregar y editar actividades</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="display: inline-block; width: 28px; height: 28px; background: #EEF2FF; border-radius: 8px; text-align: center; line-height: 28px; margin-right: 12px; font-size: 14px;">✓</span>
                                                    <span style="color: #374151; font-size: 15px; font-weight: 500;">Compartir documentos y reservas</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="display: inline-block; width: 28px; height: 28px; background: #EEF2FF; border-radius: 8px; text-align: center; line-height: 28px; margin-right: 12px; font-size: 14px;">✓</span>
                                                    <span style="color: #374151; font-size: 15px; font-weight: 500;">Gestionar gastos juntos</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td align="center" style="padding: 16px 0;">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" 
                                           style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                                            Abrir CatchMe →
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <p style="margin: 12px 0 0; color: #9CA3AF; font-size: 13px;">
                                            Inicia sesión con <strong style="color: #6B7280;">${to}</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Info Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="background: #FEF3C7; border: 2px solid #FDE68A; border-radius: 12px; padding: 16px 20px;">
                                        <p style="margin: 0; color: #92400E; font-size: 13px; line-height: 1.6;">
                                            <strong>💡 Importante:</strong> Para acceder al viaje, debes iniciar sesión en CatchMe usando este correo electrónico. El viaje aparecerá automáticamente en tu lista.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: #F9FAFB; padding: 32px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 8px; color: #6B7280; font-size: 14px; font-weight: 600;">
                                CatchMe
                            </p>
                            <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                                Planifica tus viajes juntos
                            </p>
                        </td>
                    </tr>

                </table>

                <!-- Footer Text -->
                <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 24px; max-width: 600px;">
                    <tr>
                        <td align="center">
                            <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                                Si no solicitaste esta invitación, puedes ignorar este correo.
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>
        `;

        // Send email with Resend
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        try {
            const { data, error } = await resend.emails.send({
                from: 'CatchMe <onboarding@resend.dev>', // Usaremos el dominio de prueba de Resend
                to: [to],
                subject: `¡Te invitaron a colaborar en ${tripName}!`,
                html: htmlContent,
            });

            if (error) {
                console.error('[RESEND ERROR]:', error);
                return NextResponse.json({
                    success: false,
                    error: 'Error al enviar email: ' + error.message
                }, { status: 500 });
            }

            console.log(`[EMAIL SENT] To: ${to}, ID: ${data?.id}`);
            
            return NextResponse.json({
                success: true,
                message: 'Email enviado correctamente',
                emailId: data?.id
            });

        } catch (emailError: any) {
            console.error('[EMAIL ERROR]:', emailError);
            return NextResponse.json({
                success: false,
                error: 'Error al enviar email: ' + emailError.message
            }, { status: 500 });
        }

    } catch (error) {
        console.error('[EMAIL API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error al enviar el email' },
            { status: 500 }
        );
    }
}
