/**
 * SMS Controller
 * AlphaSUP - Phase 7 SMS Integration
 */
import { Request, Response } from 'express';
/**
 * SMS gönderim controller'ı
 */
export declare const sendSMSController: (req: Request, res: Response) => Promise<void>;
/**
 * SMS durum sorgulama controller'ı
 */
export declare const getSMSStatusController: (req: Request, res: Response) => Promise<void>;
/**
 * Toplu SMS gönderim controller'ı
 */
export declare const sendBulkSMSController: (req: Request, res: Response) => Promise<void>;
