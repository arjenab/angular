import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Photo } from 'src/app/_models/Photo';
import { FileUploader } from 'ng2-file-upload';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/_services/auth.service';
import { UserService } from 'src/app/_services/user.service';
import { AlertifyService } from 'src/app/_services/alertify.service';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'app-Photo-editor',
  templateUrl: './Photo-editor.component.html',
  styleUrls: ['./Photo-editor.component.css']
})
export class PhotoEditorComponent implements OnInit {
  @Input() photos: Photo[];
  @Output() getMemberPhotoChange = new EventEmitter<string>();
  uploader: FileUploader;
  hasBaseDropZoneOver = false;
  response: string;
  baseUrl = environment.apiUrl;
  currentMain: Photo;


  constructor(private authservice: AuthService, private userService: UserService, private alertify: AlertifyService) { }

  ngOnInit() {
    this.initializeUploader();
  }

  fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  initializeUploader() {
    this.uploader = new FileUploader({
      url: this.baseUrl + 'users/' + this.authservice.decodedToken.nameid + '/photos',
      authToken: 'Bearer ' + localStorage.getItem('token'),
      isHTML5: true,
      removeAfterUpload: true,
      autoUpload: false,
      maxFileSize: 10 * 1024 * 1024
    });
    this.uploader.onAfterAddingFile = (file) => { file.withCredentials = false; };

    this.uploader.onSuccessItem = (item, response, status, headers) => {
      if (response) {
        const res: Photo = JSON.parse(response);
        const photo = {
          ...res
        };
        this.photos.push(photo);
        if (photo.isMain) {
          this.savePhotoToLocal(photo);
        }
      }
    };
  }

  setMainPhoto(photo: Photo) {
    this.userService.setMainPhoto(this.authservice.decodedToken.nameid, photo.id).subscribe(() => {
      this.currentMain = this.photos.filter(p => p.isMain === true)[0];
      this.currentMain .isMain = false;
      photo.isMain = true;
      this.savePhotoToLocal(photo);
    }, error => {
      this.alertify.error(error);
    }
    );
  }

  savePhotoToLocal(photo) {
    this.authservice.changeMemberPhoto(photo.url);
    this.authservice.currentUser.photoUrl = photo.url;
    localStorage.setItem('user', JSON.stringify(this.authservice.currentUser));
  }

  deletePhoto(id: number) {
    this.alertify.confirm('Are you sure', () => {
      this.userService.deletePhoto(this.authservice.decodedToken.nameid, id).subscribe(() => {
        this.photos.splice(this.photos.findIndex(p => p.id === id), 1);
        this.alertify.success('deleted');
      }, error => {
        this.alertify.error('Failed');
      });
    });
  }
}
